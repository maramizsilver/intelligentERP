const encryptionService = require('../services/encryption.service');
const db = require('../config/db');

async function getTenantDatabases() {
    const [rows] = await db.promisePoolMaster.query(
        'SELECT id, db_name FROM entreprises WHERE statut = "actif"'
    );
    return rows;
}

async function checkTableExists(pool, tableName) {
    try {
        const [rows] = await pool.promise().query(
            'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
            [tableName]
        );
        return rows[0].count > 0;
    } catch (err) {
        return false;
    }
}

async function migrateTenantTable(pool, tableName, fields) {
    const exists = await checkTableExists(pool, tableName);
    if (!exists) {
        console.log('Table ' + tableName + ' n\'existe pas, ignoree');
        return;
    }

    try {
        const [rows] = await pool.promise().query('SELECT * FROM ' + tableName);
        
        for (const row of rows) {
            const updates = {};
            let hasChanges = false;
            
            for (const field of fields) {
                if (row[field] && !encryptionService.isEncrypted(row[field])) {
                    updates[field] = encryptionService.encrypt(row[field]);
                    hasChanges = true;
                }
            }
            
            if (hasChanges) {
                const setClause = Object.keys(updates).map(f => f + ' = ?').join(', ');
                const values = Object.values(updates);
                values.push(row.id);
                
                await pool.promise().query(
                    'UPDATE ' + tableName + ' SET ' + setClause + ' WHERE id = ?',
                    values
                );
            }
        }
        
        console.log('Migration ' + tableName + ' terminee (' + rows.length + ' lignes)');
    } catch (err) {
        console.error('Erreur migration ' + tableName + ':', err.message);
    }
}

async function migrateAllTenantDatabases() {
    const entreprises = await getTenantDatabases();
    
    console.log('Nombre d\'entreprises a migrer: ' + entreprises.length);
    
    for (const entreprise of entreprises) {
        console.log('--- Migration entreprise ' + entreprise.id + ' (' + entreprise.db_name + ') ---');
        
        const pool = db.getClientPool(entreprise.id, entreprise.db_name);
        
        const tables = [
            { name: 'clients', fields: ['nom', 'email', 'telephone', 'adresse'] },
            { name: 'fournisseurs', fields: ['nom', 'email', 'telephone', 'adresse'] },
            { name: 'users', fields: ['nom', 'prenom', 'email'] }
        ];
        
        for (const table of tables) {
            await migrateTenantTable(pool, table.name, table.fields);
        }
    }
    
    console.log('Migration de toutes les bases tenant terminee');
}

async function main() {
    try {
        console.log('Debut de la migration des bases de donnees tenant...');
        await migrateAllTenantDatabases();
        console.log('Migration terminee avec succes');
    } catch (err) {
        console.error('Erreur lors de la migration:', err);
        process.exit(1);
    }
}

main();