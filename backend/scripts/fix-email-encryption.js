// backend/scripts/fix-email-encryption.js
const db = require('../config/db');
const encryptionService = require('../services/encryption.service');

async function fixEmailsInDatabase(pool, dbName, isMaster = false) {
    try {
        console.log(`🔧 Correction des emails dans ${dbName}...`);
        
        const [users] = await pool.promise().query('SELECT id, email FROM users');
        
        let fixedCount = 0;
        
        for (const user of users) {
            let newEmail = null;
            
            if (user.email && user.email.includes(':')) {
                try {
                    const decrypted = encryptionService.decrypt(user.email);
                    if (decrypted && decrypted.includes('@')) {
                        newEmail = decrypted;
                    }
                } catch (err) {
                    console.log(`  ⚠️ Erreur decryption pour user ${user.id}: ${err.message}`);
                }
                
                if (newEmail) {
                    await pool.promise().query(
                        'UPDATE users SET email = ? WHERE id = ?',
                        [newEmail, user.id]
                    );
                    console.log(`  ✅ User ${user.id} email mis a jour: ${newEmail}`);
                    fixedCount++;
                }
            }
        }
        
        console.log(`  📊 ${fixedCount} emails corriges dans ${dbName}`);
        return fixedCount;
    } catch (err) {
        console.error(`❌ Erreur pour ${dbName}:`, err.message);
        return 0;
    }
}

async function main() {
    console.log('🚀 Début de la correction des emails chiffrés...\n');
    
    let totalFixed = 0;
    
    // 1. Corriger la base master
    console.log('📁 === BASE MASTER ===');
    totalFixed += await fixEmailsInDatabase(db, 'master', true);
    
    // 2. Corriger les bases tenant
    console.log('\n📁 === BASES TENANT ===');
    const [entreprises] = await db.promisePoolMaster.query(
        'SELECT id, db_name, nom FROM entreprises WHERE statut = "actif"'
    );
    
    for (const entreprise of entreprises) {
        console.log(`\n🏢 Entreprise: ${entreprise.nom} (${entreprise.db_name})`);
        const clientPool = db.getClientPool(entreprise.id, entreprise.db_name);
        totalFixed += await fixEmailsInDatabase(clientPool, entreprise.db_name);
    }
    
    console.log(`\n✅ Total des emails corriges: ${totalFixed}`);
    console.log('🎉 Correction terminee !');
}

// Exécution
main().then(() => {
    console.log('\n💡 Redemarrez le serveur pour appliquer les changements.');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
});