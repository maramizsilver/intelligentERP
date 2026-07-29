const db = require('../config/db');
const encryptionService = require('../services/encryption.service');

async function fixEmailsInDatabase(pool, dbName) {
    try {
        console.log('Correction des emails dans ' + dbName);
        
        // Recuperer tous les utilisateurs
        const [users] = await pool.promise().query(
            'SELECT id, email FROM users'
        );
        
        for (const user of users) {
            let newEmail = null;
            
            // Si l'email contient ':', c'est chiffre
            if (user.email && user.email.includes(':')) {
                // Essayer de decrypter pour trouver l'email original
                try {
                    const decrypted = encryptionService.decrypt(user.email);
                    if (decrypted && decrypted.includes('@')) {
                        newEmail = decrypted;
                    }
                } catch (err) {
                    console.log('  Erreur decryption pour user ' + user.id + ': ' + err.message);
                }
                
                // Si on n'a pas pu decrypter, utiliser un email par defaut
                if (!newEmail) {
                    // Verifier si c'est un SuperAdmin
                    const [userData] = await pool.promise().query(
                        'SELECT is_super_admin FROM users WHERE id = ?',
                        [user.id]
                    );
                    
                    if (userData.length > 0 && userData[0].is_super_admin === 1) {
                        newEmail = 'superadmin@test.com';
                    } else {
                        newEmail = 'user' + user.id + '@test.com';
                    }
                }
                
                // Mettre a jour l'email en clair
                await pool.promise().query(
                    'UPDATE users SET email = ? WHERE id = ?',
                    [newEmail, user.id]
                );
                console.log('  User ' + user.id + ' email mis a jour: ' + newEmail);
            }
        }
    } catch (err) {
        console.error('Erreur pour ' + dbName + ':', err.message);
    }
}

async function fixMasterDatabase() {
    console.log('=== Correction base centrale ===');
    await fixEmailsInDatabase(db, 'master');
}

async function getTenantDatabases() {
    const [rows] = await db.promisePoolMaster.query(
        'SELECT id, db_name FROM entreprises WHERE statut = "actif"'
    );
    return rows;
}

async function fixTenantDatabases() {
    console.log('=== Correction bases tenant ===');
    const entreprises = await getTenantDatabases();
    
    for (const entreprise of entreprises) {
        console.log('Entreprise: ' + entreprise.db_name);
        const pool = db.getClientPool(entreprise.id, entreprise.db_name);
        await fixEmailsInDatabase(pool, entreprise.db_name);
    }
}

async function main() {
    try {
        await fixMasterDatabase();
        await fixTenantDatabases();
    
        console.log('Tous les emails ont ete corriges');
      
        
        // Afficher les identifiants
        const [superAdmins] = await db.promisePoolMaster.query(
            'SELECT id, email, is_super_admin FROM users WHERE is_super_admin = 1'
        );
        
        console.log('SuperAdmin:');
        for (const sa of superAdmins) {
            console.log('  Email: ' + sa.email);
        }
        
    } catch (err) {
        console.error('Erreur:', err);
    }
}

main();