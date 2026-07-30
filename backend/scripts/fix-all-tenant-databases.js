// backend/scripts/fix-all-tenant-databases.js
//
// Applique automatiquement le correctif (élargissement des colonnes
// telephone / adresse / email / nom) sur TOUTES les bases tenant
// (entreprise_<slug>_<id>), une par une, sans avoir à connaître
// leurs noms à l'avance.
//
// Usage :
//   node backend/scripts/fix-all-tenant-databases.js
//   node backend/scripts/fix-all-tenant-databases.js --dry-run   (simulation, aucune modif)
//
// Utilise les mêmes variables d'environnement que le reste de l'app
// (DB_HOST, DB_USER, DB_PASSWORD) via le fichier .env du backend.

const mysql = require('mysql2/promise');
require('dotenv').config();

const DRY_RUN = process.argv.includes('--dry-run');

const ALTER_STATEMENTS = [
  "ALTER TABLE `clients` MODIFY `telephone` VARCHAR(500) DEFAULT NULL",
  "ALTER TABLE `clients` MODIFY `adresse` TEXT DEFAULT NULL",
  "ALTER TABLE `clients` MODIFY `email` VARCHAR(500) DEFAULT NULL",
  "ALTER TABLE `clients` MODIFY `nom` VARCHAR(500) NOT NULL",
  "ALTER TABLE `fournisseurs` MODIFY `telephone` VARCHAR(500) DEFAULT NULL",
  "ALTER TABLE `fournisseurs` MODIFY `adresse` TEXT DEFAULT NULL",
  "ALTER TABLE `fournisseurs` MODIFY `email` VARCHAR(500) DEFAULT NULL",
  "ALTER TABLE `fournisseurs` MODIFY `nom` VARCHAR(500) NOT NULL",
];

async function getAdminConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: false,
  });
}

async function findTenantDatabases(admin) {
  // On cible toute base qui possède à la fois une table `clients`
  // et une table `fournisseurs` — c'est le signe fiable d'une base
  // tenant créée par createTenantDatabase(), plutôt que de se fier
  // au préfixe "entreprise_" qui pourrait changer.
  const [rows] = await admin.query(`
    SELECT DISTINCT t1.TABLE_SCHEMA AS db_name
    FROM information_schema.TABLES t1
    JOIN information_schema.TABLES t2
      ON t1.TABLE_SCHEMA = t2.TABLE_SCHEMA
    WHERE t1.TABLE_NAME = 'clients'
      AND t2.TABLE_NAME = 'fournisseurs'
      AND t1.TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
    ORDER BY t1.TABLE_SCHEMA
  `);
  return rows.map(r => r.db_name);
}

async function fixDatabase(admin, dbName) {
  await admin.changeUser({ database: dbName });
  for (const sql of ALTER_STATEMENTS) {
    if (DRY_RUN) {
      console.log(`  [DRY-RUN] ${sql}`);
      continue;
    }
    await admin.query(sql);
  }
}

(async () => {
  console.log(DRY_RUN ? '=== SIMULATION (dry-run) — aucune base ne sera modifiée ===' : '=== Application du correctif sur toutes les bases tenant ===');

  const admin = await getAdminConnection();
  let dbNames = [];

  try {
    dbNames = await findTenantDatabases(admin);
  } catch (err) {
    console.error('Impossible de lister les bases tenant :', err.message);
    await admin.end();
    process.exit(1);
  }

  if (dbNames.length === 0) {
    console.log('Aucune base tenant trouvée (aucune base avec à la fois `clients` et `fournisseurs`).');
    await admin.end();
    return;
  }

  console.log(`${dbNames.length} base(s) tenant trouvée(s) :`);
  dbNames.forEach(name => console.log(`  - ${name}`));
  console.log('');

  const results = { ok: [], fail: [] };

  for (const dbName of dbNames) {
    console.log(`--> ${dbName}`);
    try {
      await fixDatabase(admin, dbName);
      console.log(`    OK`);
      results.ok.push(dbName);
    } catch (err) {
      console.error(`    ECHEC : ${err.message}`);
      results.fail.push({ dbName, error: err.message });
    }
  }

  await admin.end();

  console.log('\n=== Résumé ===');
  console.log(`Réussies : ${results.ok.length}`);
  console.log(`Échouées : ${results.fail.length}`);
  if (results.fail.length > 0) {
    results.fail.forEach(f => console.log(`  - ${f.dbName} : ${f.error}`));
    process.exitCode = 1;
  }
})();
