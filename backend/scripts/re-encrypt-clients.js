const db = require('../config/db');
const encryptionService = require('../services/encryption.service');

async function reEncryptClients() {
    console.log('🔐 RE-CHIFFREMENT DES CLIENTS...\n');

    const [entreprises] = await db.promisePoolMaster.query(
        'SELECT id, db_name FROM entreprises WHERE statut = "actif"'
    );

    for (const entreprise of entreprises) {
        console.log(`\n📁 ${entreprise.db_name}`);
        const pool = db.getClientPool(entreprise.id, entreprise.db_name);

        try {
            const [clients] = await pool.promise().query(
                'SELECT id, email, telephone, adresse FROM clients'
            );

            for (const client of clients) {
                const updates = {};
                let changed = false;

                if (client.email && !client.email.includes(':')) {
                    updates.email = encryptionService.encrypt(client.email);
                    changed = true;
                }
                if (client.telephone && !client.telephone.includes(':')) {
                    updates.telephone = encryptionService.encrypt(client.telephone);
                    changed = true;
                }
                if (client.adresse && !client.adresse.includes(':')) {
                    updates.adresse = encryptionService.encrypt(client.adresse);
                    changed = true;
                }

                if (changed) {
                    const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
                    const values = [...Object.values(updates), client.id];
                    await pool.promise().query(
                        `UPDATE clients SET ${setClause} WHERE id = ?`,
                        values
                    );
                    console.log(`  ✅ Client ${client.id}: re-chiffré`);
                }
            }
        } catch (err) {
            console.error(`  ❌ Erreur:`, err.message);
        }
    }

    console.log('\n✅ RE-CHIFFREMENT DES CLIENTS TERMINÉ !');
    process.exit(0);
}

reEncryptClients();