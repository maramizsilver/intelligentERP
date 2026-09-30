// backend/scripts/add-session-report-columns.js
const db = require('../config/db');

async function columnExists(table, column) {
    const [rows] = await db.promisePoolMaster.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows[0].cnt > 0;
}

async function addColumnIfMissing(table, column, definition) {
    if (await columnExists(table, column)) {
        console.log(`[MIGRATION] ${table}.${column} existe deja`);
        return;
    }
    await db.promisePoolMaster.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`[MIGRATION] ${table}.${column} ajoutee`);
}

async function main() {
    try {
        await addColumnIfMissing('sessions', 'is_reported', 'TINYINT(1) DEFAULT 0');
        await addColumnIfMissing('sessions', 'reported_at', 'DATETIME DEFAULT NULL');
        await addColumnIfMissing('sessions', 'report_reason', 'VARCHAR(255) DEFAULT NULL');
        await addColumnIfMissing('user_connections', 'is_reported', 'TINYINT(1) DEFAULT 0');
        await addColumnIfMissing('user_connections', 'reported_at', 'DATETIME DEFAULT NULL');
        console.log('[MIGRATION] Termine avec succes.');
        process.exit(0);
    } catch (err) {
        console.error('[MIGRATION] Erreur:', err);
        process.exit(1);
    }
}
main();