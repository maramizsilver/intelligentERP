// services/database.service.js
const mysql = require('mysql2/promise');
require('dotenv').config();

function sanitizeForDbName(str) {
  return (str || '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'entreprise';
}

function generateDbName(entrepriseNom, entrepriseId) {
  const slug = sanitizeForDbName(entrepriseNom);
  return `entreprise_${slug}_${entrepriseId}`;
}

async function getAdminConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: false
  });
}

const INITIAL_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `INSERT IGNORE INTO modules (nom) VALUES
    ('Ventes'), ('Achats'), ('Stock'), ('Finance'), ('Utilisateurs'), ('Documents')`,

  `CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    est_admin_entreprise BOOLEAN DEFAULT FALSE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    module_id INT NOT NULL,
    consultation BOOLEAN DEFAULT FALSE,
    creation BOOLEAN DEFAULT FALSE,
    modification BOOLEAN DEFAULT FALSE,
    suppression BOOLEAN DEFAULT FALSE,
    validation BOOLEAN DEFAULT FALSE,
    export BOOLEAN DEFAULT FALSE,
    UNIQUE KEY uniq_role_module (role_id, module_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT DEFAULT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_external BOOLEAN DEFAULT FALSE,
    client_id INT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL DEFAULT NULL,
    reset_token VARCHAR(255) NULL DEFAULT NULL,
    reset_token_expires TIMESTAMP NULL DEFAULT NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dernier_numero_bc INT NOT NULL DEFAULT 0,
    dernier_numero_devis INT NOT NULL DEFAULT 0,
    dernier_numero_transaction INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `INSERT INTO sequences (dernier_numero_bc, dernier_numero_devis, dernier_numero_transaction)
   SELECT 0, 0, 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM sequences)`,

  `CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    telephone VARCHAR(50) DEFAULT NULL,
    adresse VARCHAR(255) DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS fournisseurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    telephone VARCHAR(50) DEFAULT NULL,
    adresse VARCHAR(255) DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    prix DECIMAL(12,2) NOT NULL DEFAULT 0,
    quantite_stock INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

async function createTenantDatabase(entrepriseId, dbName) {
  if (!/^[a-z0-9_]+$/.test(dbName)) {
    throw new Error(`Nom de base invalide : ${dbName}`);
  }

  const admin = await getAdminConnection();
  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await admin.changeUser({ database: dbName });
    for (const statement of INITIAL_SCHEMA) {
      await admin.query(statement);
    }
    console.log(`[TENANT] Base "${dbName}" prête pour l'entreprise #${entrepriseId}`);
  } finally {
    await admin.end();
  }
}

module.exports = {
  generateDbName,
  sanitizeForDbName,
  createTenantDatabase
};