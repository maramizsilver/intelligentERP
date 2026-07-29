const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const ENCRYPTED_BACKUP_DIR = process.env.ENCRYPTED_BACKUP_DIR || './backups/encrypted';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_MASTER = process.env.DB_MASTER_NAME || 'erp_db';

const backupEncryption = require('../services/backupEncryption.service');
const db = require('../config/db');

function getMysqldumpPath() {
    const xamppPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
    if (fs.existsSync(xamppPath)) {
        return '"' + xamppPath + '"';
    }
    return 'mysqldump';
}

async function getTenantDatabases() {
    try {
        const connection = await db.promisePoolMaster.query(
            'SELECT db_name FROM entreprises WHERE statut = "actif"'
        );
        return connection[0].map(r => r.db_name);
    } catch (err) {
        console.error('[SCHEDULER] Erreur getTenantDatabases:', err.message);
        return [];
    }
}

async function backupDatabase(dbName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, dbName + '_' + timestamp + '.sql');

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (!fs.existsSync(ENCRYPTED_BACKUP_DIR)) {
        fs.mkdirSync(ENCRYPTED_BACKUP_DIR, { recursive: true });
    }

    const mysqldump = getMysqldumpPath();
    const passwordOption = DB_PASSWORD ? '-p' + DB_PASSWORD : '';
    const command = mysqldump + ' -h ' + DB_HOST + ' -u ' + DB_USER + ' ' + passwordOption + ' ' + dbName + ' > ' + backupPath;

    try {
        await execPromise(command);

        if (!fs.existsSync(backupPath)) {
            return null;
        }

        const stats = fs.statSync(backupPath);
        if (stats.size === 0) {
            return null;
        }

        const encryptedPath = path.join(ENCRYPTED_BACKUP_DIR, dbName + '_' + timestamp + '.enc');
        const encryptedResult = backupEncryption.encryptFile(backupPath, encryptedPath);

        return {
            dbName: dbName,
            backupPath: backupPath,
            encryptedPath: encryptedResult.success ? encryptedResult.outputPath : null,
            size: stats.size,
            encrypted: encryptedResult.success,
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error('[SCHEDULER] Erreur backup ' + dbName + ':', err.message);
        return null;
    }
}

async function runScheduledBackup() {
    console.log('[SCHEDULER] Lancement de la sauvegarde planifiee...');
    
    const databases = await getTenantDatabases();
    databases.push(DB_MASTER);

    const results = [];
    for (const db of databases) {
        const result = await backupDatabase(db);
        if (result) results.push(result);
    }

    const backupLog = path.join(BACKUP_DIR, 'scheduled_backup_log.json');
    const logs = fs.existsSync(backupLog) ? JSON.parse(fs.readFileSync(backupLog, 'utf8')) : [];
    logs.push({
        timestamp: new Date().toISOString(),
        databases: results,
        total: results.length,
        encrypted: results.filter(r => r.encrypted).length
    });
    
    if (logs.length > 100) {
        logs.shift();
    }
    
    fs.writeFileSync(backupLog, JSON.stringify(logs, null, 2));

    console.log('[SCHEDULER] Sauvegarde planifiee terminee: ' + results.length + ' bases sauvegardees');
    return results;
}

function startScheduler() {
    const scheduleTime = process.env.BACKUP_SCHEDULE || '0 2 * * *';
    
    console.log('[SCHEDULER] Demarrage du planificateur...');
    console.log('[SCHEDULER] Horaire: ' + scheduleTime);
    
    cron.schedule(scheduleTime, () => {
        runScheduledBackup();
    });
    
    console.log('[SCHEDULER] Planificateur demarre avec succes');
}

module.exports = {
    runScheduledBackup,
    startScheduler
};