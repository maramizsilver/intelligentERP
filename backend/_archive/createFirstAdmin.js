// backend/seed/createFirstAdmin.js
require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');
const bcrypt = require('bcryptjs');

(async () => {
  const email = 'admin@benjeddou-ts.com';
  const password = 'ChangeMoiImmediatement123!'; // à changer après première connexion

  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?)';

  db.query(sql, ['Super', 'Admin', email, hashedPassword, 'admin'], (err, result) => {
    if (err) {
      console.error('Erreur:', err.message);
      process.exit(1);
    }
    console.log(`Admin créé avec succès, id=${result.insertId}`);
    process.exit(0);
  });
})();