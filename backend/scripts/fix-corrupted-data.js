// backend/scripts/fix-corrupted-data.js
const db = require('../config/db');
const encryptionService = require('../services/encryption.service');

async function fixCorruptedData() {
    console.log('🔧 Correction des données corrompues...\n');

    const tables = [
        { name: 'clients', fields: ['nom', 'email', 'telephone', 'adresse'] },
        { name: 'fournisseurs', fields: ['nom', 'email', 'telephone', 'adresse'] }
    ];

    const [entreprises] = await db.promisePoolMaster.query(
        'SELECT id, db_name FROM entreprises WHERE statut = "actif"'
    );

    console.log(`📁 ${entreprises.length} bases tenant...\n`);

    for (const entreprise of entreprises) {
        console.log(`🏢 ${entreprise.db_name}`);
        const clientPool = db.getClientPool(entreprise.id, entreprise.db_name);

        for (const table of tables) {
            try {
                const [checkTable] = await clientPool.promise().query(
                    `SELECT COUNT(*) as count FROM information_schema.tables 
                     WHERE table_schema = DATABASE() AND table_name = ?`,
                    [table.name]
                );
                
                if (checkTable[0].count === 0) {
                    console.log(`  ⚠️ Table ${table.name} n'existe pas`);
                    continue;
                }

                const [rows] = await clientPool.promise().query(`SELECT * FROM ${table.name}`);
                let fixed = 0;
                
                for (const row of rows) {
                    const updates = {};
                    for (const field of table.fields) {
                        if (row[field] && typeof row[field] === 'string' && row[field].includes(':')) {
                            const decrypted = encryptionService.decrypt(row[field]);
                            if (decrypted && decrypted !== row[field] && !decrypted.includes(':')) {
                                updates[field] = decrypted;
                            }
                        }
                    }
                    if (Object.keys(updates).length > 0) {
                        const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
                        const values = [...Object.values(updates), row.id];
                        await clientPool.promise().query(
                            `UPDATE ${table.name} SET ${setClause} WHERE id = ?`,
                            values
                        );
                        fixed++;
                        console.log(`  ✅ ${table.name} ${row.id}: corrigé`);
                    }
                }
                console.log(`  ✅ ${table.name}: ${fixed} lignes corrigées`);
            } catch (err) {
                console.error(`  ❌ Erreur ${table.name}:`, err.message);
            }
        }
    }

    console.log('\n✅ Correction terminée !');
    process.exit(0);
}

fixCorruptedData();