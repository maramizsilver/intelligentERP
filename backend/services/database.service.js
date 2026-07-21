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
  // ============================================================
  // 1. TABLES DE BASE
  // ============================================================
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

  // ============================================================
  // TABLE USERS AVEC COLONNES MFA
  // ============================================================
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
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255) DEFAULT NULL,
    mfa_backup_codes JSON DEFAULT NULL,
    mfa_verified BOOLEAN DEFAULT FALSE,
    mfa_attempts INT DEFAULT 0,
    mfa_locked_until TIMESTAMP NULL DEFAULT NULL,
    mfa_temp_secret VARCHAR(255) DEFAULT NULL,
    mfa_banner_dismissed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dernier_numero_bc INT NOT NULL DEFAULT 0,
    dernier_numero_devis INT NOT NULL DEFAULT 0,
    dernier_numero_transaction INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `INSERT IGNORE INTO sequences (dernier_numero_bc, dernier_numero_devis, dernier_numero_transaction)
   SELECT 0, 0, 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM sequences)`,

  // ============================================================
  // 2. TABLES CLIENTS ET FOURNISSEURS
  // ============================================================
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

  // ============================================================
  // 3. TABLES PRODUITS
  // ============================================================
  `CREATE TABLE IF NOT EXISTS produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    prix DECIMAL(12,2) NOT NULL DEFAULT 0,
    quantite_stock INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 4. TABLES COMMANDES
  // ============================================================
  `CREATE TABLE IF NOT EXISTS commandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    date_commande DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(12,2) DEFAULT 0,
    statut ENUM('en_attente', 'confirmee', 'livree', 'annulee') DEFAULT 'en_attente',
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS commande_produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 5. TABLES ACHATS
  // ============================================================
  `CREATE TABLE IF NOT EXISTS achats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fournisseur_id INT NOT NULL,
    numero_bc VARCHAR(50) NOT NULL,
    date_commande DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_livraison_prevue DATE DEFAULT NULL,
    total_ht DECIMAL(12,2) DEFAULT 0,
    total_ttc DECIMAL(12,2) DEFAULT 0,
    statut ENUM('brouillon', 'envoye', 'recu_partiel', 'recu_total', 'annule') DEFAULT 'brouillon',
    notes TEXT DEFAULT NULL,
    FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS achat_produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    achat_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(12,2) NOT NULL,
    total_ligne DECIMAL(12,2) NOT NULL,
    quantite_recue INT DEFAULT 0,
    FOREIGN KEY (achat_id) REFERENCES achats(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 6. TABLES DEVIS
  // ============================================================
  `CREATE TABLE IF NOT EXISTS devis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    numero_devis VARCHAR(50) NOT NULL,
    date_devis DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_validite DATE NOT NULL,
    total_ht DECIMAL(12,2) DEFAULT 0,
    total_ttc DECIMAL(12,2) DEFAULT 0,
    remise DECIMAL(5,2) DEFAULT 0,
    statut ENUM('brouillon', 'envoye', 'accepte', 'refuse', 'expire') DEFAULT 'brouillon',
    notes TEXT DEFAULT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS devis_produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    devis_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(12,2) NOT NULL,
    remise_ligne DECIMAL(5,2) DEFAULT 0,
    total_ligne DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 7. TABLES ENTREPOTS
  // ============================================================
  `CREATE TABLE IF NOT EXISTS entrepots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse VARCHAR(255) DEFAULT NULL,
    responsable VARCHAR(100) DEFAULT NULL,
    actif BOOLEAN DEFAULT TRUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS stock_entrepot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrepot_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 0,
    FOREIGN KEY (entrepot_id) REFERENCES entrepots(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_entrepot_produit (entrepot_id, produit_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 8. TABLES INVENTAIRES
  // ============================================================
  `CREATE TABLE IF NOT EXISTS inventaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrepot_id INT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_cloture DATETIME DEFAULT NULL,
    statut ENUM('brouillon', 'en_cours', 'termine', 'annule') DEFAULT 'brouillon',
    notes TEXT DEFAULT NULL,
    created_by INT DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS inventaire_lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventaire_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite_theorique INT NOT NULL DEFAULT 0,
    quantite_comptee INT DEFAULT NULL,
    ecart INT DEFAULT 0,
    FOREIGN KEY (inventaire_id) REFERENCES inventaires(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 9. TABLES MOUVEMENTS STOCK
  // ============================================================
  `CREATE TABLE IF NOT EXISTS mouvements_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produit_id INT NOT NULL,
    type ENUM('entree', 'sortie', 'ajustement', 'commande_client', 'achat_fournisseur', 'inventaire') NOT NULL,
    quantite INT NOT NULL,
    reference_id INT DEFAULT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    ancien_stock INT NOT NULL,
    nouveau_stock INT NOT NULL,
    motif TEXT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 10. TABLES PROMOTIONS
  // ============================================================
  `CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    type ENUM('pourcentage', 'fixe', 'livraison_offerte') NOT NULL,
    valeur DECIMAL(12,2) NOT NULL,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    utilisation_max INT DEFAULT NULL,
    utilisation_count INT DEFAULT 0,
    actif BOOLEAN DEFAULT TRUE,
    produits_concernes JSON DEFAULT NULL,
    clients_concernes JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 11. TABLES DOCUMENTS
  // ============================================================
  `CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type_document ENUM('facture', 'contrat', 'bon_commande', 'devis', 'identite', 'autre') DEFAULT 'autre',
    reference_type VARCHAR(50) DEFAULT NULL,
    reference_id INT DEFAULT NULL,
    chemin_fichier VARCHAR(255) NOT NULL,
    nom_original VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    taille_octets INT NOT NULL,
    uploaded_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 12. TABLES ARCHIVES
  // ============================================================
  `CREATE TABLE IF NOT EXISTS archives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_entite VARCHAR(50) NOT NULL,
    entite_id INT NOT NULL,
    donnees JSON NOT NULL,
    motif TEXT DEFAULT NULL,
    archived_by INT DEFAULT NULL,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 13. TABLES PAIEMENTS
  // ============================================================
  `CREATE TABLE IF NOT EXISTS paiements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_transaction VARCHAR(50) NOT NULL UNIQUE,
    reference_type ENUM('commande', 'achat') NOT NULL,
    reference_id INT NOT NULL,
    montant DECIMAL(12,2) NOT NULL,
    mode_paiement ENUM('especes', 'cheque', 'virement', 'carte', 'stripe', 'paypal', 'flouci', 'konnect') NOT NULL,
    provider_ref VARCHAR(255) DEFAULT NULL,
    statut ENUM('en_attente', 'valide', 'echoue', 'rembourse') DEFAULT 'en_attente',
    created_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 14. TABLES FINANCE - DEPENSES
  // ============================================================
  `CREATE TABLE IF NOT EXISTS depenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categorie ENUM('fournisseur', 'salaire', 'loyer', 'electricite', 'transport', 'marketing', 'impot', 'autre') NOT NULL,
    montant DECIMAL(12,2) NOT NULL,
    description TEXT DEFAULT NULL,
    date_depense DATE NOT NULL,
    fournisseur_id INT DEFAULT NULL,
    mode_paiement ENUM('especes', 'cheque', 'virement', 'carte', 'stripe', 'paypal', 'flouci', 'konnect') DEFAULT NULL,
    justificatif_document_id INT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 15. TABLES FINANCE - RECETTES
  // ============================================================
  `CREATE TABLE IF NOT EXISTS recettes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    montant DECIMAL(12,2) NOT NULL,
    description TEXT DEFAULT NULL,
    date_recette DATE NOT NULL,
    client_id INT DEFAULT NULL,
    mode_paiement ENUM('especes', 'cheque', 'virement', 'carte', 'stripe', 'paypal', 'flouci', 'konnect') DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 16. TABLES LOGS CALCULS
  // ============================================================
  `CREATE TABLE IF NOT EXISTS logs_calculs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT DEFAULT NULL,
    type_calcul VARCHAR(50) NOT NULL,
    type_calcul_detaille VARCHAR(50) NOT NULL,
    montant DECIMAL(12,2) NOT NULL,
    taux DECIMAL(10,4) DEFAULT NULL,
    nb_jours INT DEFAULT NULL,
    resultat DECIMAL(12,2) NOT NULL,
    details JSON DEFAULT NULL,
    taux_reference_used JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // ============================================================
  // 17. TABLES TAUX REFERENCE CENTRAL
  // ============================================================
  `CREATE TABLE IF NOT EXISTS taux_reference_central (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categorie VARCHAR(100) NOT NULL,
    sous_categorie VARCHAR(100) DEFAULT NULL,
    nom VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    taux DECIMAL(10,4) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    created_by INT DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS taux_reference_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    taux_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    anciennes_valeurs JSON DEFAULT NULL,
    nouvelles_valeurs JSON DEFAULT NULL,
    modified_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    console.log(`[TENANT] Base "${dbName}" prete pour l'entreprise #${entrepriseId}`);
    console.log(`[TENANT] ${INITIAL_SCHEMA.length} tables creees`);
  } finally {
    await admin.end();
  }
}

module.exports = {
  generateDbName,
  sanitizeForDbName,
  createTenantDatabase
};