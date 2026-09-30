const db = require('../config/db');
const encryptionService = require('../services/encryption.service');

async function reEncryptFournisseurs() {
    console.log('🔐 RE-CHIFFREMENT DES FOURNISSEURS...\n');

    const [entreprises] = await db.promisePoolMaster.query(
        'SELECT id, db_name FROM entreprises WHERE statut = "actif"'
    );

    for (const entreprise of entreprises) {
        console.log(`\n📁 ${entreprise.db_name}`);
        const pool = db.getClientPool(entreprise.id, entreprise.db_name);

        try {
            const [fournisseurs] = await pool.promise().query(
                'SELECT id, email, telephone, adresse FROM fournisseurs'
            );

            for (const fournisseur of fournisseurs) {
                const updates = {};
                let changed = false;

                if (fournisseur.email && !fournisseur.email.includes(':')) {
                    updates.email = encryptionService.encrypt(fournisseur.email);
                    changed = true;
                }
                if (fournisseur.telephone && !fournisseur.telephone.includes(':')) {
                    updates.telephone = encryptionService.encrypt(fournisseur.telephone);
                    changed = true;
                }
                if (fournisseur.adresse && !fournisseur.adresse.includes(':')) {
                    updates.adresse = encryptionService.encrypt(fournisseur.adresse);
                    changed = true;
                }

                if (changed) {
                    const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
                    const values = [...Object.values(updates), fournisseur.id];
                    await pool.promise().query(
                        `UPDATE fournisseurs SET ${setClause} WHERE id = ?`,
                        values
                    );
                    console.log(`  ✅ Fournisseur ${fournisseur.id}: re-chiffré`);
                }
            }
        } catch (err) {
            console.error(`  ❌ Erreur:`, err.message);
        }
    }

    console.log('\n✅ RE-CHIFFREMENT TERMINÉ !');
    process.exit(0);
}

reEncryptFournisseurs();