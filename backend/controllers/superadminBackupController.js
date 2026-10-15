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
const { spawn } = require('child_process');

const NOM_FICHIER_OK = /^[A-Za-z0-9._-]+$/;
const DB_NOM_OK = /^[A-Za-z0-9_]+$/;

// Empêche ../ dans les noms de fichiers (path traversal)
function cheminSecurise(dossier, filename) {
  const nom = path.basename(String(filename || ''));
  if (!NOM_FICHIER_OK.test(nom) || nom.startsWith('.')) return null;
  const base = path.resolve(dossier);
  const complet = path.resolve(base, nom);
  return complet.startsWith(base + path.sep) ? complet : null;
}

// Chemins SANS guillemets (spawn ne passe pas par un shell)
function getMysqldumpPath() {
  if (process.env.MYSQLDUMP_PATH) return process.env.MYSQLDUMP_PATH;
  const candidats = [
    'C:\\xampp\\mysql\\bin\\mysqldump.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe'
  ];
  return candidats.find((p) => fs.existsSync(p)) || 'mysqldump';
}
const MYSQL_BIN = process.env.MYSQL_BIN || 'mysql';

// Le mot de passe passe par l'environnement : jamais dans la ligne de commande ni dans les logs
const envMysql = () => ({ ...process.env, MYSQL_PWD: DB_PASSWORD });

function dumpVersFichier(dbName, sortie) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(sortie);
    const p = spawn(getMysqldumpPath(),
      ['-h', DB_HOST, '-u', DB_USER, '--single-transaction', '--routines', dbName],
      { env: envMysql() });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.stdout.pipe(out);
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err || `mysqldump a retourné ${code}`))));
  });
}

function importerDepuisFichier(dbName, entree) {
  return new Promise((resolve, reject) => {
    const p = spawn(MYSQL_BIN, ['-h', DB_HOST, '-u', DB_USER, dbName], { env: envMysql() });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err || `mysql a retourné ${code}`))));
    fs.createReadStream(entree).pipe(p.stdin);
  });
}

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
  if (!DB_NOM_OK.test(dbName)) { console.error('BACKUP :Nom de base invalide ignoré:', dbName); return null; }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.mkdirSync(ENCRYPTED_BACKUP_DIR, { recursive: true });

  const backupPath = path.join(BACKUP_DIR, `${dbName}_${timestamp}.sql`);
  const encryptedPath = path.join(ENCRYPTED_BACKUP_DIR, `${dbName}_${timestamp}.enc`);

  try {
    await dumpVersFichier(dbName, backupPath);
    const stats = fs.statSync(backupPath);
    if (stats.size === 0) { console.error('[BACKUP] Fichier vide pour', dbName); return null; }

    const checksum = backupEncryption.generateChecksum(backupPath);
    const enc = backupEncryption.encryptFile(backupPath, encryptedPath);
    const sig = enc.success ? backupEncryption.signBackup(encryptedPath) : { success: false };

    return {
      dbName, backupPath,
      encryptedPath: enc.success ? enc.outputPath : null,
      size: stats.size, encryptedSize: enc.success ? enc.size : null,
      checksum, signature: sig.success ? sig.signature : null,
      timestamp: new Date().toISOString(), encrypted: enc.success
    };
  } catch (err) {
    console.error(`[BACKUP] Erreur pour ${dbName}:`, err.message);
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
                const isSigned = fs.existsSync(encryptedPath + '.sig');
                
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
  const filePath = cheminSecurise(BACKUP_DIR, req.params.filename);
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ message: 'Backup introuvable' });
  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(filePath));
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  fs.createReadStream(filePath).pipe(res);
};

exports.downloadEncryptedBackup = async (req, res) => {
  const encryptedPath = cheminSecurise(ENCRYPTED_BACKUP_DIR, req.params.filename);
  if (!encryptedPath || !fs.existsSync(encryptedPath)) return res.status(404).json({ message: 'Backup chiffré introuvable' });
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(encryptedPath));
  res.setHeader('X-Encrypted', 'true');
  res.setHeader('X-Signed', fs.existsSync(encryptedPath + '.sig') ? 'true' : 'false');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Encrypted, X-Signed');
  fs.createReadStream(encryptedPath).pipe(res);
};

exports.deleteBackup = async (req, res) => {
  try {
    const sqlPath = cheminSecurise(BACKUP_DIR, req.params.filename);
    if (!sqlPath) return res.status(400).json({ message: 'Nom de fichier invalide' });
    const encryptedPath = cheminSecurise(ENCRYPTED_BACKUP_DIR, req.params.filename.replace('.sql', '.enc'));
    const aSupprimer = [sqlPath, encryptedPath, encryptedPath && encryptedPath + '.sig'].filter(Boolean);
    let deleted = 0;
    for (const f of aSupprimer) if (fs.existsSync(f)) { fs.unlinkSync(f); deleted++; }
    res.json({ message: deleted + ' fichier(s) supprimé(s)', deleted });
  } catch (err) {
    console.error('Erreur deleteBackup:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

exports.restoreBackup = async (req, res) => {
  let tempSqlPath = null;
  try {
    const { targetDb, confirmation } = req.body;
    if (!targetDb || !DB_NOM_OK.test(targetDb)) return res.status(400).json({ message: 'targetDb invalide' });
    if (confirmation !== targetDb) {
      return res.status(400).json({ message: 'Confirmation requise : renvoyez le nom exact de la base dans "confirmation"' });
    }
    const autorisees = [...(await getTenantDatabases()), DB_MASTER];
    if (!autorisees.includes(targetDb)) return res.status(400).json({ message: 'Base cible inconnue' });

    const encryptedPath = cheminSecurise(ENCRYPTED_BACKUP_DIR, req.params.filename);
    if (!encryptedPath || !fs.existsSync(encryptedPath)) return res.status(404).json({ message: 'Backup chiffré introuvable' });

    // Vérifier la signature AVANT de déchiffrer/restaurer
    const sigPath = encryptedPath + '.sig';
    if (fs.existsSync(sigPath)) {
      const v = backupEncryption.verifySignature(encryptedPath, sigPath);
      if (v.success && !v.isValid) return res.status(400).json({ message: 'Signature invalide, restauration annulée' });
    }

    tempSqlPath = path.join(BACKUP_DIR, 'temp_restore_' + Date.now() + '.sql');
    const dec = backupEncryption.decryptFile(encryptedPath, tempSqlPath);
    if (!dec.success) return res.status(500).json({ message: 'Erreur de déchiffrement' });

    await importerDepuisFichier(targetDb, tempSqlPath);
    res.json({ message: 'Restauration terminée avec succès', targetDb });
  } catch (err) {
    console.error('Erreur restoreBackup:', err.message);
    res.status(500).json({ message: 'Erreur lors de la restauration' });
  } finally {
    if (tempSqlPath && fs.existsSync(tempSqlPath)) fs.unlinkSync(tempSqlPath);
  }
};