const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const CIBLES = [
  ['devis', 'client_id'], ['commandes', 'client_id'], ['factures', 'client_id'],
  ['devis_produits', 'produit_id'], ['commande_produits', 'produit_id'], ['achat_produits', 'produit_id'],
  ['achats', 'fournisseur_id'], ['stock_entrepot', 'produit_id'],
  ['inventaire_lignes', 'produit_id'], ['mouvements_stock', 'produit_id']
];

(async () => {
  if (!process.env.DB_USER) {
    console.error('DB_USER manquant dans backend/.env');
    process.exit(1);
  }

  const admin = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  const [dbs] = await admin.query(
    "SELECT schema_name AS n FROM information_schema.schemata WHERE schema_name LIKE 'entreprise\\_%'");

  if (dbs.length === 0) {
    console.log('Aucune base entreprise_% trouvée. Rien à migrer.');
    await admin.end();
    return;
  }

  console.log(`${dbs.length} base(s) à examiner.\n`);

  let total = 0, skipped = 0, erreurs = 0;

  for (const { n } of dbs) {
    for (const [table, col] of CIBLES) {
      try {
        const [fks] = await admin.query(
          `SELECT k.CONSTRAINT_NAME AS name, k.REFERENCED_TABLE_NAME AS rt,
                  k.REFERENCED_COLUMN_NAME AS rc, r.DELETE_RULE AS regle
           FROM information_schema.KEY_COLUMN_USAGE k
           JOIN information_schema.REFERENTIAL_CONSTRAINTS r
             ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
            AND r.TABLE_NAME = k.TABLE_NAME
           WHERE k.TABLE_SCHEMA = ? AND k.TABLE_NAME = ? AND k.COLUMN_NAME = ?
             AND k.REFERENCED_TABLE_NAME IS NOT NULL`, [n, table, col]);

        for (const fk of fks) {
          if (fk.regle !== 'CASCADE') {
            console.log(`↷ ${n}.${table}.${col} déjà en ${fk.regle} — skip`);
            skipped++;
            continue;
          }
          await admin.query(`ALTER TABLE \`${n}\`.\`${table}\` DROP FOREIGN KEY \`${fk.name}\``);
          await admin.query(
            `ALTER TABLE \`${n}\`.\`${table}\` ADD CONSTRAINT \`${fk.name}\`
             FOREIGN KEY (\`${col}\`) REFERENCES \`${fk.rt}\`(\`${fk.rc}\`) ON DELETE RESTRICT`);
          console.log(`✔ ${n}.${table}.${col} → RESTRICT`);
          total++;
        }
      } catch (e) {
        console.warn(`⚠ ${n}.${table}.${col}: ${e.message}`);
        erreurs++;
      }
    }
  }

  console.log(`\n=== Résumé ===`);
  console.log(`Migrées : ${total}`);
  console.log(`Déjà OK : ${skipped}`);
  console.log(`Erreurs : ${erreurs}`);
  await admin.end();
})();