const db = require('../config/db');

async function decryptAllUsers() {
    console.log('🔓 DÉCHIFFREMENT DE TOUS LES UTILISATEURS...\n');

    // 1. DÉCHIFFRER LA BASE MASTER
    console.log('📁 Base MASTER...');
    const [masterUsers] = await db.promisePoolMaster.query(
        'SELECT id, nom, prenom, email FROM users'
    );

    for (const user of masterUsers) {
        const updates = {};
        let changed = false;

        // Déchiffrer le nom
        if (user.nom && user.nom.includes(':')) {
            updates.nom = extractDecryptedValue(user.nom);
            changed = true;
        }

        // Déchiffrer le prénom
        if (user.prenom && user.prenom.includes(':')) {
            updates.prenom = extractDecryptedValue(user.prenom);
            changed = true;
        }

        // Déchiffrer l'email
        if (user.email && user.email.includes(':')) {
            updates.email = extractDecryptedValue(user.email);
            changed = true;
        }

        if (changed) {
            const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
            const values = [...Object.values(updates), user.id];

            await db.promisePoolMaster.query(
                `UPDATE users SET ${setClause} WHERE id = ?`,
                values
            );
            console.log(`  ✅ User ${user.id}: déchiffré`);
        }
    }

    // 2. DÉCHIFFRER LES BASES TENANT
    const [entreprises] = await db.promisePoolMaster.query(
        'SELECT id, db_name FROM entreprises WHERE statut = "actif"'
    );

    for (const entreprise of entreprises) {
        console.log(`\n📁 Base TENANT: ${entreprise.db_name}`);
        const pool = db.getClientPool(entreprise.id, entreprise.db_name);

        try {
            const [tenantUsers] = await pool.promise().query(
                'SELECT id, nom, prenom, email FROM users'
            );

            for (const user of tenantUsers) {
                const updates = {};
                let changed = false;

                if (user.nom && user.nom.includes(':')) {
                    updates.nom = extractDecryptedValue(user.nom);
                    changed = true;
                }

                if (user.prenom && user.prenom.includes(':')) {
                    updates.prenom = extractDecryptedValue(user.prenom);
                    changed = true;
                }

                if (user.email && user.email.includes(':')) {
                    updates.email = extractDecryptedValue(user.email);
                    changed = true;
                }

                if (changed) {
                    const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
                    const values = [...Object.values(updates), user.id];

                    await pool.promise().query(
                        `UPDATE users SET ${setClause} WHERE id = ?`,
                        values
                    );
                    console.log(`    ✅ User ${user.id}: déchiffré`);
                }
            }
        } catch (err) {
            console.error(`  ❌ Erreur pour ${entreprise.db_name}:`, err.message);
        }
    }

    console.log('\n✅ TOUS LES UTILISATEURS ONT ÉTÉ DÉCHIFFRÉS !');
    process.exit(0);
}

function extractDecryptedValue(encrypted) {
    if (!encrypted) return encrypted;
    
    // Format: iv:authTag:cipher
    const parts = encrypted.split(':');
    if (parts.length !== 3) return encrypted;
    
    // Vérifier si c'est un email valide
    const emailMatch = encrypted.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
        return emailMatch[0];
    }
    
    // Pour les noms/prénoms, on ne peut pas les extraire automatiquement
    // On va donc les remplacer par un placeholder
    // MAIS on va essayer de les récupérer depuis l'email si possible
    console.warn(`  ⚠️ Donnée chiffrée non identifiable: ${encrypted.substring(0, 30)}...`);
    return '[À METTRE À JOUR]';
}

// Exécuter le script
decryptAllUsers();