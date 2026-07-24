const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_MASTER = process.env.DB_MASTER_NAME || 'erp_db';

async function getTenantDatabases() {
    const connection = await db.promisePoolMaster.query(
        'SELECT db_name FROM entreprises WHERE statut = "actif"'
    );
    return connection[0].map(r => r.db_name);
}

async function backupDatabase(dbName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `${dbName}_${timestamp}.sql`);

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} ${dbName} > ${backupPath}`;

    try {
        await execPromise(command);
        return {
            dbName,
            backupPath,
            size: fs.statSync(backupPath).size,
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error(`Erreur backup ${dbName}:`, err.message);
        return null;
    }
}

async function backupAll() {
    const databases = await getTenantDatabases();
    databases.push(DB_MASTER);

    const results = [];
    for (const db of databases) {
        const result = await backupDatabase(db);
        if (result) results.push(result);
    }

    const backupLog = path.join(BACKUP_DIR, 'backup_log.json');
    const logs = fs.existsSync(backupLog) ? JSON.parse(fs.readFileSync(backupLog, 'utf8')) : [];
    logs.push({
        timestamp: new Date().toISOString(),
        databases: results,
        total: results.length
    });
    fs.writeFileSync(backupLog, JSON.stringify(logs, null, 2));

    return results;
}

async function cleanupOldBackups(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const files = fs.readdirSync(BACKUP_DIR);
    let deleted = 0;

    for (const file of files) {
        if (file.endsWith('.sql') && !file.includes('backup_log')) {
            const filePath = path.join(BACKUP_DIR, file);
            if (fs.statSync(filePath).mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                deleted++;
            }
        }
    }
    return deleted;
}

exports.triggerBackup = async (req, res) => {
    try {
        const results = await backupAll();
        res.json({
            message: 'Sauvegarde declenchee avec succes',
            databases: results,
            total: results.length
        });
    } catch (err) {
        console.error('Erreur triggerBackup:', err);
        res.status(500).json({ message: 'Erreur lors de la sauvegarde' });
    }
};

exports.getBackupHistory = async (req, res) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            return res.json({ backups: [], total: 0 });
        }

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sql') && !f.includes('backup_log'))
            .map(f => {
                const filePath = path.join(BACKUP_DIR, f);
                const stats = fs.statSync(filePath);
                const parts = f.split('_');
                const dbName = parts.slice(0, -2).join('_') || parts[0];
                return {
                    filename: f,
                    dbName: dbName,
                    size: stats.size,
                    created_at: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ backups: files, total: files.length });
    } catch (err) {
        console.error('Erreur getBackupHistory:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.cleanupBackups = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const deleted = await cleanupOldBackups(parseInt(days));
        res.json({
            message: `${deleted} anciennes sauvegardes supprimees`,
            deleted
        });
    } catch (err) {
        console.error('Erreur cleanupBackups:', err);
        res.status(500).json({ message: 'Erreur lors du nettoyage' });
    }
};