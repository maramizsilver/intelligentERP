// backend/scripts/fix-entreprise-names.js
const db = require('../config/db');
const encryptionService = require('../services/encryption.service');

async function fixEntrepriseNames() {
    console.log('🔧 Correction des noms d\'entreprises...\n');
    
    const [entreprises] = await db.promisePoolMaster.query(
        'SELECT id, nom, email FROM entreprises'
    );
    
    let fixed = 0;
    for (const entreprise of entreprises) {
        const updates = {};
        
        if (entreprise.nom && entreprise.nom.includes(':')) {
            try {
                const decrypted = encryptionService.decrypt(entreprise.nom);
                if (decrypted && decrypted !== entreprise.nom && !decrypted.includes(':')) {
                    updates.nom = decrypted;
                }
            } catch (err) {}
        }
        
        if (entreprise.email && entreprise.email.includes(':')) {
            try {
                const decrypted = encryptionService.decrypt(entreprise.email);
                if (decrypted && decrypted !== entreprise.email && !decrypted.includes(':')) {
                    updates.email = decrypted;
                }
            } catch (err) {}
        }
        
        if (Object.keys(updates).length > 0) {
            const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
            const values = [...Object.values(updates), entreprise.id];
            await db.promisePoolMaster.query(
                `UPDATE entreprises SET ${setClause} WHERE id = ?`,
                values
            );
            fixed++;
            console.log(`  ✅ Entreprise ${entreprise.id} corrigée: ${updates.nom || updates.email}`);
        }
    }
    
    console.log(`\n✅ ${fixed} entreprises corrigées`);
    process.exit(0);
}

fixEntrepriseNames();