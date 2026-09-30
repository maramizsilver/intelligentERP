
const db = require('../config/db');
const encryptionService = require('../services/encryption.service');

const TABLES = [
    { name: 'clients', fields: ['nom', 'email', 'telephone', 'adresse'] },
    { name: 'fournisseurs', fields: ['nom', 'email', 'telephone', 'adresse'] }
];

async function tableExists(pool, tableName) {
    const [rows] = await pool.promise().query(
        `SELECT COUNT(*) as count FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [tableName]
    );
    return rows[0].count > 0;
}

async function fixTable(pool, table) {
    const exists = await tableExists(pool, table.name);
    if (!exists) {
        console.log(`  - Table ${table.name} absente, ignorée`);
        return;
    }

    const [rows] = await pool.promise().query(`SELECT * FROM ${table.name}`);
    let fixedCount = 0;

    for (const row of rows) {
        const updates = {};

        for (const field of table.fields) {
            const value = row[field];
            if (value && !encryptionService.isEncrypted(value)) {
                updates[field] = encryptionService.encrypt(value);
            }
        }

        if (Object.keys(updates).length > 0) {
            const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
            const values = [...Object.values(updates), row.id];
            await pool.promise().query(
                `UPDATE ${table.name} SET ${setClause} WHERE id = ?`,
                values
            );
            fixedCount++;
        }
    }

    console.log(`   ${table.name}: ${fixedCount}/${rows.length} lignes chiffrées`);
}

async function main() {
    console.log(' Chiffrement des données clients/fournisseurs en clair...\n');

    const [entreprises] = await db.promisePoolMaster.query(
        'SELECT id, db_name FROM entreprises WHERE statut = "actif"'
    );

    console.log(`${entreprises.length} entreprise(s) active(s) à traiter.\n`);

    for (const entreprise of entreprises) {
        console.log(` ${entreprise.db_name}`);
        const pool = db.getClientPool(entreprise.id, entreprise.db_name);

        for (const table of TABLES) {
            await fixTable(pool, table);
        }
        console.log('');
    }

    console.log(' Migration terminée.');
    process.exit(0);
}

main().catch(err => {
    console.error(' Erreur pendant la migration:', err);
    process.exit(1);
});