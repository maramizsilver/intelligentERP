// backend/scripts/fix-login-emails.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const encryptionService = require('../services/encryption.service');

async function fixLoginEmails() {
    console.log('🔧 Correction automatique des emails pour le login...\n');

    try {
        // 1. Récupérer toutes les entreprises actives
        const [entreprises] = await db.promisePoolMaster.query(
            'SELECT id, db_name, email FROM entreprises WHERE statut = "actif"'
        );

        console.log(`📊 ${entreprises.length} entreprises actives trouvées\n`);

        let totalFixed = 0;

        for (const entreprise of entreprises) {
            console.log(`🏢 Entreprise ID: ${entreprise.id} (${entreprise.db_name})`);

            // 2. Récupérer les utilisateurs de la base tenant
            try {
                const clientPool = db.getClientPool(entreprise.id, entreprise.db_name);
                const [tenantUsers] = await clientPool.promise().query(
                    'SELECT id, email FROM users'
                );

                for (const user of tenantUsers) {
                    let cleanEmail = user.email;

                    // 3. Si l'email est chiffré, le déchiffrer
                    if (user.email && user.email.includes(':')) {
                        try {
                            const decrypted = encryptionService.decrypt(user.email);
                            if (decrypted && decrypted.includes('@')) {
                                cleanEmail = decrypted;
                            }
                        } catch (err) {
                            console.log(`  ⚠️ Erreur déchiffrement user ${user.id}`);
                            continue;
                        }
                    }

                    // 4. Mettre à jour l'email en clair dans la base tenant
                    if (cleanEmail !== user.email) {
                        await clientPool.promise().query(
                            'UPDATE users SET email = ? WHERE id = ?',
                            [cleanEmail, user.id]
                        );
                        console.log(`  ✅ Tenant user ${user.id} mis à jour: ${cleanEmail}`);
                        totalFixed++;
                    }

                    // 5. Mettre à jour l'email dans la base master
                    await db.promisePoolMaster.query(
                        `UPDATE users SET email = ? 
                         WHERE entreprise_id = ? AND id = ?`,
                        [cleanEmail, entreprise.id, user.id]
                    );
                    console.log(`  ✅ Master user ${user.id} mis à jour: ${cleanEmail}`);
                }
            } catch (err) {
                console.error(`  ❌ Erreur pour ${entreprise.db_name}:`, err.message);
            }
        }

        // 6. Vérifier le SuperAdmin
        const [superAdmins] = await db.promisePoolMaster.query(
            'SELECT id, email FROM users WHERE is_super_admin = 1'
        );

        for (const sa of superAdmins) {
            if (sa.email && sa.email.includes(':')) {
                try {
                    const decrypted = encryptionService.decrypt(sa.email);
                    if (decrypted && decrypted.includes('@')) {
                        await db.promisePoolMaster.query(
                            'UPDATE users SET email = ? WHERE id = ?',
                            [decrypted, sa.id]
                        );
                        console.log(`  ✅ SuperAdmin ${sa.id} mis à jour: ${decrypted}`);
                        totalFixed++;
                    }
                } catch (err) {
                    console.log(`  ⚠️ Erreur SuperAdmin ${sa.id}`);
                }
            }
        }

        console.log(`\n✅ Correction terminée ! ${totalFixed} emails mis à jour.`);
        console.log('💡 Redémarrez le serveur pour appliquer les changements.');

    } catch (err) {
        console.error('❌ Erreur fatale:', err);
        process.exit(1);
    }
}

// Exécution
fixLoginEmails().then(() => {
    process.exit(0);
});