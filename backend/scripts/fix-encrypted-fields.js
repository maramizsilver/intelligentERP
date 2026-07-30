// backend/scripts/fix-encrypted-fields.js
const db = require('../config/db');
const encryptionService = require('../services/encryption.service');

async function fixEncryptedFields() {
    console.log('🔧 Correction des champs chiffrés...\n');

    const tables = [
        { name: 'clients', fields: ['email', 'telephone', 'adresse'] },
        { name: 'fournisseurs', fields: ['email', 'telephone', 'adresse'] }
    ];

    const [entreprises] = await db.promisePoolMaster.query(
        'SELECT id, db_name FROM entreprises WHERE statut = "actif"'
    );

    for (const entreprise of entreprises) {
        console.log(`\n🏢 ${entreprise.db_name}`);
        const clientPool = db.getClientPool(entreprise.id, entreprise.db_name);

        for (const table of tables) {
            try {
                const [rows] = await clientPool.promise().query(`SELECT * FROM ${table.name}`);
                let fixed = 0;
                for (const row of rows) {
                    const updates = {};
                    for (const field of table.fields) {
                        if (row[field] && row[field].includes(':')) {
                            try {
                                const decrypted = encryptionService.decrypt(row[field]);
                                if (decrypted && decrypted !== row[field]) {
                                    updates[field] = decrypted;
                                    fixed++;
                                }
                            } catch (err) {}
                        }
                    }
                    if (Object.keys(updates).length > 0) {
                        const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
                        const values = [...Object.values(updates), row.id];
                        await clientPool.promise().query(
                            `UPDATE ${table.name} SET ${setClause} WHERE id = ?`,
                            values
                        );
                    }
                }
                console.log(`  ✅ ${table.name}: ${fixed} champs corrigés`);
            } catch (err) {
                console.error(`  ❌ Erreur ${table.name}:`, err.message);
            }
        }
    }

    console.log('\n✅ Correction terminée !');
    process.exit(0);
}

fixEncryptedFields();