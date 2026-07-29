const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const backupEncryption = require('../services/backupEncryption.service');
require('dotenv').config();

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const ENCRYPTED_BACKUP_DIR = process.env.ENCRYPTED_BACKUP_DIR || './backups/encrypted';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_MASTER = process.env.DB_MASTER_NAME || 'erp_db';

function getMysqldumpPath() {
    const xamppPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
    if (fs.existsSync(xamppPath)) {
        console.log('[BACKUP] mysqldump trouve: ' + xamppPath);
        return '"' + xamppPath + '"';
    }
    
    const possiblePaths = [
        'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
        'C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe',
        'C:\\wamp64\\bin\\mysql\\mysql5.7.31\\bin\\mysqldump.exe'
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log('[BACKUP] mysqldump trouve: ' + p);
            return '"' + p + '"';
        }
    }
    
    console.warn('[BACKUP] mysqldump non trouve, utilisation de la commande par defaut');
    return 'mysqldump';
}

async function getTenantDatabases() {
    try {
        const connection = await db.promisePoolMaster.query(
            'SELECT db_name FROM entreprises WHERE statut = "actif"'
        );
        return connection[0].map(r => r.db_name);
    } catch (err) {
        console.error('[BACKUP] Erreur getTenantDatabases:', err.message);
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

    console.log('[BACKUP] Commande:', command);

    try {
        const { stdout, stderr } = await execPromise(command);
        
        if (stderr && !stderr.includes('Warning')) {
            console.error('[BACKUP] Erreur stderr:', stderr);
            return null;
        }

        if (!fs.existsSync(backupPath)) {
            console.error('[BACKUP] Fichier non cree pour ' + dbName);
            return null;
        }

        const stats = fs.statSync(backupPath);
        console.log('[BACKUP] Taille du fichier pour ' + dbName + ':', stats.size, 'octets');
        
        if (stats.size === 0) {
            console.error('[BACKUP] Fichier vide pour ' + dbName);
            return null;
        }

        const checksum = backupEncryption.generateChecksum(backupPath);
        
        const encryptedPath = path.join(ENCRYPTED_BACKUP_DIR, dbName + '_' + timestamp + '.enc');
        const encryptedResult = backupEncryption.encryptFile(backupPath, encryptedPath);
        
        const signatureResult = backupEncryption.signBackup(backupPath);
        
        return {
            dbName: dbName,
            backupPath: backupPath,
            encryptedPath: encryptedResult.success ? encryptedResult.outputPath : null,
            size: stats.size,
            encryptedSize: encryptedResult.success ? encryptedResult.size : null,
            checksum: checksum,
            signature: signatureResult.success ? signatureResult.signature : null,
            timestamp: new Date().toISOString(),
            encrypted: encryptedResult.success
        };
    } catch (err) {
        console.error('[BACKUP] Erreur pour ' + dbName + ':', err.message);
        return null;
    }
}

async function backupAll() {
    const databases = await getTenantDatabases();
    databases.push(DB_MASTER);

    console.log('[BACKUP] Bases a sauvegarder:', databases);

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
        total: results.length,
        encrypted: results.filter(r => r.encrypted).length
    });
    fs.writeFileSync(backupLog, JSON.stringify(logs, null, 2));

    return results;
}

async function cleanupOldBackups(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deleted = 0;

    if (fs.existsSync(BACKUP_DIR)) {
        const files = fs.readdirSync(BACKUP_DIR);
        for (const file of files) {
            if (file.endsWith('.sql') && !file.includes('backup_log')) {
                const filePath = path.join(BACKUP_DIR, file);
                try {
                    if (fs.statSync(filePath).mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        deleted++;
                    }
                } catch (err) {
                    console.error('[BACKUP] Erreur suppression ' + filePath, err.message);
                }
            }
        }
    }
    
    if (fs.existsSync(ENCRYPTED_BACKUP_DIR)) {
        const encryptedFiles = fs.readdirSync(ENCRYPTED_BACKUP_DIR);
        for (const file of encryptedFiles) {
            if (file.endsWith('.enc') || file.endsWith('.sig')) {
                const filePath = path.join(ENCRYPTED_BACKUP_DIR, file);
                try {
                    if (fs.statSync(filePath).mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        deleted++;
                    }
                } catch (err) {
                    console.error('[BACKUP] Erreur suppression ' + filePath, err.message);
                }
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
            total: results.length,
            encrypted: results.filter(r => r.encrypted).length
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
                
                const encryptedPath = path.join(ENCRYPTED_BACKUP_DIR, f.replace('.sql', '.enc'));
                const isEncrypted = fs.existsSync(encryptedPath);
                const signaturePath = filePath + '.sig';
                const isSigned = fs.existsSync(signaturePath);
                
                return {
                    filename: f,
                    dbName: dbName,
                    size: stats.size,
                    created_at: stats.mtime.toISOString(),
                    encrypted: isEncrypted,
                    signed: isSigned,
                    checksum: isEncrypted ? 'present' : 'absent'
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
            message: deleted + ' anciennes sauvegardes supprimees',
            deleted: deleted
        });
    } catch (err) {
        console.error('Erreur cleanupBackups:', err);
        res.status(500).json({ message: 'Erreur lors du nettoyage' });
    }
};

exports.downloadBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(BACKUP_DIR, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Backup introuvable' });
        }
        
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (err) {
        console.error('Erreur downloadBackup:', err);
        res.status(500).json({ message: 'Erreur lors du telechargement' });
    }
};

exports.downloadEncryptedBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const encryptedPath = path.join(ENCRYPTED_BACKUP_DIR, filename);
        
        if (!fs.existsSync(encryptedPath)) {
            return res.status(404).json({ message: 'Backup chiffre introuvable' });
        }
        
        const signaturePath = encryptedPath + '.sig';
        const hasSignature = fs.existsSync(signaturePath);
        
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
        res.setHeader('X-Encrypted', 'true');
        res.setHeader('X-Signed', hasSignature ? 'true' : 'false');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Encrypted, X-Signed');
        
        const stream = fs.createReadStream(encryptedPath);
        stream.pipe(res);
    } catch (err) {
        console.error('Erreur downloadEncryptedBackup:', err);
        res.status(500).json({ message: 'Erreur lors du telechargement' });
    }
};

exports.restoreBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const { targetDb } = req.body;
        
        if (!targetDb) {
            return res.status(400).json({ message: 'targetDb est requis' });
        }
        
        const encryptedPath = path.join(ENCRYPTED_BACKUP_DIR, filename);
        
        if (!fs.existsSync(encryptedPath)) {
            return res.status(404).json({ message: 'Backup chiffre introuvable' });
        }
        
        const tempSqlPath = path.join(BACKUP_DIR, 'temp_restore_' + Date.now() + '.sql');
        
        const decryptResult = backupEncryption.decryptFile(encryptedPath, tempSqlPath);
        
        if (!decryptResult.success) {
            return res.status(500).json({ message: 'Erreur de dechiffrement: ' + decryptResult.error });
        }
        
        const signaturePath = encryptedPath + '.sig';
        if (fs.existsSync(signaturePath)) {
            const verifyResult = backupEncryption.verifySignature(tempSqlPath, signaturePath);
            if (verifyResult.success && !verifyResult.isValid) {
                fs.unlinkSync(tempSqlPath);
                return res.status(400).json({ message: 'Signature invalide, restauration annulee' });
            }
        }
        
        const mysqldump = getMysqldumpPath();
        const passwordOption = DB_PASSWORD ? '-p' + DB_PASSWORD : '';
        const command = mysqldump + ' -h ' + DB_HOST + ' -u ' + DB_USER + ' ' + passwordOption + ' ' + targetDb + ' < ' + tempSqlPath;
        
        try {
            await execPromise(command);
            fs.unlinkSync(tempSqlPath);
            res.json({ message: 'Restauration terminee avec succes', targetDb: targetDb });
        } catch (err) {
            fs.unlinkSync(tempSqlPath);
            res.status(500).json({ message: 'Erreur lors de la restauration: ' + err.message });
        }
    } catch (err) {
        console.error('Erreur restoreBackup:', err);
        res.status(500).json({ message: 'Erreur lors de la restauration' });
    }
};

exports.deleteBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        
        const sqlPath = path.join(BACKUP_DIR, filename);
        const encryptedPath = path.join(ENCRYPTED_BACKUP_DIR, filename.replace('.sql', '.enc'));
        const signaturePath = sqlPath + '.sig';
        
        let deleted = 0;
        
        if (fs.existsSync(sqlPath)) {
            fs.unlinkSync(sqlPath);
            deleted++;
        }
        
        if (fs.existsSync(encryptedPath)) {
            fs.unlinkSync(encryptedPath);
            deleted++;
        }
        
        if (fs.existsSync(signaturePath)) {
            fs.unlinkSync(signaturePath);
            deleted++;
        }
        
        res.json({ 
            message: deleted + ' fichier(s) supprime(s)',
            deleted: deleted
        });
    } catch (err) {
        console.error('Erreur deleteBackup:', err);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};