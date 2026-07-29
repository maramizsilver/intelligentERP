const encryptionService = require('../services/encryption.service');
const db = require('../config/db');

async function migrateMasterDatabase() {
    console.log('Migration de la base centrale...');
    
    const tables = [
        { name: 'entreprises', fields: ['nom', 'email'] },
        { name: 'users', fields: ['nom', 'prenom', 'email'] }
    ];
    
    for (const table of tables) {
        try {
            const [rows] = await db.promisePoolMaster.query('SELECT * FROM ' + table.name);
            
            for (const row of rows) {
                const updates = {};
                let hasChanges = false;
                
                for (const field of table.fields) {
                    if (row[field] && !encryptionService.isEncrypted(row[field])) {
                        updates[field] = encryptionService.encrypt(row[field]);
                        hasChanges = true;
                    }
                }
                
                if (hasChanges) {
                    const setClause = Object.keys(updates).map(f => f + ' = ?').join(', ');
                    const values = Object.values(updates);
                    values.push(row.id);
                    
                    await db.promisePoolMaster.query(
                        'UPDATE ' + table.name + ' SET ' + setClause + ' WHERE id = ?',
                        values
                    );
                    console.log('Migration ' + table.name + ' id ' + row.id + ' terminee');
                }
            }
        } catch (err) {
            console.error('Erreur migration ' + table.name + ':', err.message);
        }
    }
    
    console.log('Migration base centrale terminee');
}

async function getTenantDatabases() {
    const [rows] = await db.promisePoolMaster.query(
        'SELECT id, db_name FROM entreprises WHERE statut = "actif"'
    );
    return rows;
}

async function migrateTenantTable(pool, tableName, fields) {
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
        
        console.log('Migration ' + tableName + ' terminee');
    } catch (err) {
        console.error('Erreur migration ' + tableName + ':', err.message);
    }
}

async function migrateTenantDatabases() {
    const entreprises = await getTenantDatabases();
    
    for (const entreprise of entreprises) {
        console.log('Migration entreprise ' + entreprise.id + ' (' + entreprise.db_name + ')');
        
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
    
    console.log('Migration des bases tenant terminee');
}

async function main() {
    try {
        await migrateMasterDatabase();
        await migrateTenantDatabases();
        console.log('Toutes les migrations sont terminees avec succes');
    } catch (err) {
        console.error('Erreur lors de la migration:', err);
        process.exit(1);
    }
}

main();