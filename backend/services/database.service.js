// backend/services/database.service.js
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
    reset_token_used BOOLEAN DEFAULT FALSE,
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
    telephone VARCHAR(20) DEFAULT NULL,
    matricule VARCHAR(50) DEFAULT NULL,
    fonction VARCHAR(100) DEFAULT NULL,
    service VARCHAR(100) DEFAULT NULL,
    actif BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    INDEX idx_users_telephone (telephone),
    INDEX idx_users_matricule (matricule),
    INDEX idx_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entreprise_id INT NOT NULL UNIQUE,
    dernier_numero_bc INT NOT NULL DEFAULT 0,
    dernier_numero_devis INT NOT NULL DEFAULT 0,
    dernier_numero_transaction INT NOT NULL DEFAULT 0,
    dernier_numero_facture INT NOT NULL DEFAULT 0,
    INDEX idx_entreprise (entreprise_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(500) NOT NULL,
    prenom VARCHAR(100) DEFAULT NULL,
    raison_sociale VARCHAR(255) DEFAULT NULL,
    email VARCHAR(500) DEFAULT NULL,
    telephone VARCHAR(500) DEFAULT NULL,
    adresse TEXT DEFAULT NULL,
    ville VARCHAR(100) DEFAULT NULL,
    code_postal VARCHAR(20) DEFAULT NULL,
    pays VARCHAR(100) DEFAULT 'Tunisie',
    matricule_fiscal VARCHAR(50) DEFAULT NULL,
    numero_cin VARCHAR(20) DEFAULT NULL,
    type_client ENUM('particulier','entreprise','association') DEFAULT 'particulier',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_clients_email (email),
    INDEX idx_clients_telephone (telephone),
    INDEX idx_clients_matricule_fiscal (matricule_fiscal),
    INDEX idx_clients_numero_cin (numero_cin),
    INDEX idx_clients_nom_prenom (nom, prenom),
    INDEX idx_clients_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS fournisseurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(500) NOT NULL,
    raison_sociale VARCHAR(255) DEFAULT NULL,
    email VARCHAR(500) DEFAULT NULL,
    telephone VARCHAR(500) DEFAULT NULL,
    adresse TEXT DEFAULT NULL,
    ville VARCHAR(100) DEFAULT NULL,
    code_postal VARCHAR(20) DEFAULT NULL,
    pays VARCHAR(100) DEFAULT 'Tunisie',
    matricule_fiscal VARCHAR(50) DEFAULT NULL,
    numero_tva VARCHAR(50) DEFAULT NULL,
    rib VARCHAR(50) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_fournisseurs_email (email),
    INDEX idx_fournisseurs_telephone (telephone),
    INDEX idx_fournisseurs_matricule_fiscal (matricule_fiscal),
    INDEX idx_fournisseurs_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    reference VARCHAR(100) DEFAULT NULL,
    code_barre VARCHAR(50) DEFAULT NULL,
    prix DECIMAL(12,2) NOT NULL DEFAULT 0,
    prix_achat DECIMAL(12,3) DEFAULT NULL,
    prix_vente DECIMAL(12,3) DEFAULT NULL,
    prix_unitaire_ht DECIMAL(12,3) DEFAULT NULL,
    tva DECIMAL(5,2) DEFAULT 0.00,
    unite VARCHAR(20) DEFAULT 'unite',
    categorie VARCHAR(100) DEFAULT NULL,
    fournisseur_id INT DEFAULT NULL,
    quantite_stock INT NOT NULL DEFAULT 0,
    seuil_alerte INT DEFAULT 5,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_produits_reference (reference),
    INDEX idx_produits_code_barre (code_barre),
    INDEX idx_produits_categorie (categorie),
    INDEX idx_produits_fournisseur_id (fournisseur_id),
    INDEX idx_produits_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS devis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    numero_devis VARCHAR(50) NOT NULL,
    reference VARCHAR(100) DEFAULT NULL,
    date_devis DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_validite DATE NOT NULL,
    total_ht DECIMAL(12,2) DEFAULT 0,
    montant_tva DECIMAL(12,2) DEFAULT 0.00,
    total_ttc DECIMAL(12,2) DEFAULT 0,
    remise DECIMAL(5,2) DEFAULT 0,
    tva DECIMAL(5,2) DEFAULT 0.00,
    statut ENUM('brouillon', 'envoye', 'accepte', 'refuse', 'expire') DEFAULT 'brouillon',
    notes TEXT DEFAULT NULL,
    conditions_paiement VARCHAR(255) DEFAULT NULL,
    created_by INT DEFAULT NULL,
    entreprise_id INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_devis_numero (numero_devis),
    INDEX idx_devis_reference (reference),
    INDEX idx_devis_date_devis (date_devis),
    INDEX idx_devis_statut (statut),
    INDEX idx_devis_entreprise (entreprise_id),
    INDEX idx_devis_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS devis_produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    devis_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(12,2) NOT NULL,
    remise_ligne DECIMAL(5,2) DEFAULT 0,
    total_ligne DECIMAL(12,2) NOT NULL,
    company_id INT DEFAULT 1,
    FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    INDEX idx_devis_produits_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS commandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    devis_id INT NULL,
    numero_commande VARCHAR(50) DEFAULT NULL,
    reference VARCHAR(100) DEFAULT NULL,
    date_commande DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(12,2) DEFAULT 0,
    montant_ht DECIMAL(12,2) DEFAULT 0.00,
    montant_tva DECIMAL(12,2) DEFAULT 0.00,
    total_ttc DECIMAL(12,2) DEFAULT 0.00,
    remise DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT DEFAULT NULL,
    statut ENUM('en_attente', 'confirmee', 'livree', 'annulee') DEFAULT 'en_attente',
    created_by INT DEFAULT NULL,
    entreprise_id INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL,
    INDEX idx_commandes_numero (numero_commande),
    INDEX idx_commandes_reference (reference),
    INDEX idx_commandes_statut (statut),
    INDEX idx_commandes_entreprise (entreprise_id),
    INDEX idx_commandes_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS commande_produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(12,2) NOT NULL,
    company_id INT DEFAULT 1,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    INDEX idx_commande_produits_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS factures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_facture VARCHAR(50) NOT NULL,
    client_id INT NOT NULL,
    devis_id INT NULL,
    commande_id INT NULL,
    date_facture DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_ht DECIMAL(12,2) DEFAULT 0.00,
    montant_tva DECIMAL(12,2) DEFAULT 0.00,
    total_ttc DECIMAL(12,2) DEFAULT 0.00,
    statut ENUM('brouillon','emise','payee','annulee') DEFAULT 'brouillon',
    notes TEXT NULL,
    created_by INT NULL,
    entreprise_id INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    UNIQUE KEY numero_facture_unique (numero_facture),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE SET NULL,
    INDEX idx_factures_entreprise (entreprise_id),
    INDEX idx_factures_client (client_id),
    INDEX idx_factures_devis (devis_id),
    INDEX idx_factures_commande (commande_id),
    INDEX idx_factures_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
    entreprise_id INT NOT NULL DEFAULT 1,
    company_id INT DEFAULT 1,
    FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE CASCADE,
    INDEX idx_achats_entreprise (entreprise_id),
    INDEX idx_achats_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS achat_produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    achat_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(12,2) NOT NULL,
    total_ligne DECIMAL(12,2) NOT NULL,
    quantite_recue INT DEFAULT 0,
    company_id INT DEFAULT 1,
    FOREIGN KEY (achat_id) REFERENCES achats(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    INDEX idx_achat_produits_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS entrepots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse VARCHAR(255) DEFAULT NULL,
    responsable VARCHAR(100) DEFAULT NULL,
    actif BOOLEAN DEFAULT TRUE,
    company_id INT DEFAULT 1,
    INDEX idx_entrepots_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS stock_entrepot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrepot_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 0,
    company_id INT DEFAULT 1,
    FOREIGN KEY (entrepot_id) REFERENCES entrepots(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_entrepot_produit (entrepot_id, produit_id),
    INDEX idx_stock_entrepot_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS inventaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrepot_id INT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_cloture DATETIME DEFAULT NULL,
    statut ENUM('brouillon', 'en_cours', 'termine', 'annule') DEFAULT 'brouillon',
    notes TEXT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    company_id INT DEFAULT 1,
    INDEX idx_inventaires_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS inventaire_lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventaire_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite_theorique INT NOT NULL DEFAULT 0,
    quantite_comptee INT DEFAULT NULL,
    ecart INT DEFAULT 0,
    company_id INT DEFAULT 1,
    FOREIGN KEY (inventaire_id) REFERENCES inventaires(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    INDEX idx_inventaire_lignes_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
    company_id INT DEFAULT 1,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    INDEX idx_mouvements_stock_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_promotions_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    type_document ENUM('facture', 'contrat', 'bon_commande', 'devis', 'identite', 'autre') DEFAULT 'autre',
    reference_type VARCHAR(50) DEFAULT NULL,
    reference_id INT DEFAULT NULL,
    chemin_fichier VARCHAR(255) NOT NULL,
    nom_original VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    taille_octets INT NOT NULL,
    tags VARCHAR(255) DEFAULT NULL,
    version INT DEFAULT 1,
    est_genere BOOLEAN DEFAULT FALSE,
    uploaded_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_documents_type (type_document),
    INDEX idx_documents_reference (reference_type, reference_id),
    INDEX idx_documents_created_at (created_at),
    INDEX idx_documents_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS archives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_entite VARCHAR(50) NOT NULL,
    entite_id INT NOT NULL,
    donnees JSON NOT NULL,
    motif TEXT DEFAULT NULL,
    archived_by INT DEFAULT NULL,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_archives_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_paiements_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
    company_id INT DEFAULT 1,
    FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE SET NULL,
    INDEX idx_depenses_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
    company_id INT DEFAULT 1,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    INDEX idx_recettes_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_logs_calculs_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_taux_reference_central_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS taux_reference_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    taux_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    anciennes_valeurs JSON DEFAULT NULL,
    nouvelles_valeurs JSON DEFAULT NULL,
    modified_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_taux_reference_audit_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entreprise_id INT DEFAULT NULL,
    utilisateur_id INT DEFAULT NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) DEFAULT NULL,
    details JSON DEFAULT NULL,
    ip VARCHAR(50) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_entreprise (entreprise_id),
    INDEX idx_utilisateur (utilisateur_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_audit_logs_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS audit_connexions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    ip VARCHAR(50) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_utilisateur (utilisateur_id),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at),
    INDEX idx_audit_connexions_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS audit_operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entreprise_id INT DEFAULT NULL,
    utilisateur_id INT DEFAULT NULL,
    operation VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT DEFAULT NULL,
    anciennes_valeurs JSON DEFAULT NULL,
    nouvelles_valeurs JSON DEFAULT NULL,
    ip VARCHAR(50) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_entreprise (entreprise_id),
    INDEX idx_utilisateur (utilisateur_id),
    INDEX idx_operation (operation),
    INDEX idx_table (table_name),
    INDEX idx_audit_operations_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS entreprises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    raison_sociale VARCHAR(255) DEFAULT NULL,
    adresse TEXT DEFAULT NULL,
    ville VARCHAR(100) DEFAULT NULL,
    code_postal VARCHAR(20) DEFAULT NULL,
    pays VARCHAR(100) DEFAULT 'Tunisie',
    telephone VARCHAR(20) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    site_web VARCHAR(255) DEFAULT NULL,
    matricule_fiscal VARCHAR(50) DEFAULT NULL,
    registre_commerce VARCHAR(50) DEFAULT NULL,
    capital_social DECIMAL(12,2) DEFAULT NULL,
    numero_tva VARCHAR(50) DEFAULT NULL,
    logo VARCHAR(255) DEFAULT NULL,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_entreprises_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS documents_generes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    type_document VARCHAR(50) NOT NULL,
    modele_utilise VARCHAR(255) NOT NULL,
    donnees_utilisees JSON DEFAULT NULL,
    tags_manquants VARCHAR(500) DEFAULT NULL,
    est_financier BOOLEAN DEFAULT FALSE,
    langue_utilisee VARCHAR(10) DEFAULT 'fr',
    devise_utilisee VARCHAR(10) DEFAULT 'TND',
    genere_par INT DEFAULT NULL,
    genere_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_documents_generes_type (type_document),
    INDEX idx_documents_generes_genere_le (genere_le),
    INDEX idx_documents_generes_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS ocr_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT DEFAULT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    langue_utilisee VARCHAR(10) DEFAULT 'fr',
    confiance_ocr DECIMAL(5,2) DEFAULT NULL,
    texte_extrait LONGTEXT DEFAULT NULL,
    champs_detectes JSON DEFAULT NULL,
    analyse_par INT DEFAULT NULL,
    analyse_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_ocr_analyses_analyse_le (analyse_le),
    INDEX idx_ocr_analyses_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type_document VARCHAR(50) NOT NULL,
    description TEXT DEFAULT NULL,
    chemin_fichier VARCHAR(255) NOT NULL,
    est_commun BOOLEAN DEFAULT FALSE,
    est_actif BOOLEAN DEFAULT TRUE,
    tags_disponibles JSON DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_templates_type (type_document),
    INDEX idx_templates_est_commun (est_commun),
    INDEX idx_templates_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS chatbot_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role ENUM('user','assistant') NOT NULL,
    contenu MEDIUMTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_chatbot_messages_user (user_id, created_at),
    INDEX idx_chatbot_messages_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // NOUVELLES TABLES POUR LA GESTION DOCUMENTAIRE
  `CREATE TABLE IF NOT EXISTS documents_metier (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_document VARCHAR(50) NOT NULL,
    numero VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    reference_id INT DEFAULT NULL,
    tiers_nom VARCHAR(255) DEFAULT NULL,
    donnees JSON NOT NULL,
    montant_ht DECIMAL(12,2) DEFAULT 0,
    montant_ttc DECIMAL(12,2) DEFAULT 0,
    statut VARCHAR(30) DEFAULT 'brouillon',
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_documents_metier_type (type_document),
    INDEX idx_documents_metier_numero (numero),
    INDEX idx_documents_metier_reference (reference_type, reference_id),
    INDEX idx_documents_metier_company_id (company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS documents_historique (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_document VARCHAR(50) NOT NULL,
    document_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSON DEFAULT NULL,
    performed_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id INT DEFAULT 1,
    INDEX idx_documents_historique_doc (type_document, document_id),
    INDEX idx_documents_historique_company_id (company_id)
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

async function migrerBaseExistante(dbName) {
  const admin = await getAdminConnection();
  try {
    await admin.changeUser({ database: dbName });
    
    const migrations = [
      `ALTER TABLE commandes 
       ADD COLUMN IF NOT EXISTS devis_id INT NULL AFTER client_id,
       ADD CONSTRAINT IF NOT EXISTS commandes_devis_fk 
       FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL`,
      
      `ALTER TABLE devis 
       ADD COLUMN IF NOT EXISTS entreprise_id INT NOT NULL DEFAULT 1`,
      
      `ALTER TABLE commandes 
       ADD COLUMN IF NOT EXISTS entreprise_id INT NOT NULL DEFAULT 1`,
      
      `ALTER TABLE achats 
       ADD COLUMN IF NOT EXISTS entreprise_id INT NOT NULL DEFAULT 1`,
      
      `ALTER TABLE sequences 
       ADD COLUMN IF NOT EXISTS dernier_numero_facture INT NOT NULL DEFAULT 0`,
      
      // NOUVEAU: Ajout de la colonne dernier_numero_generique
      `ALTER TABLE sequences 
       ADD COLUMN IF NOT EXISTS dernier_numero_generique INT NOT NULL DEFAULT 0`,
      
      `CREATE TABLE IF NOT EXISTS factures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_facture VARCHAR(50) NOT NULL,
        client_id INT NOT NULL,
        devis_id INT NULL,
        commande_id INT NULL,
        date_facture DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_ht DECIMAL(12,2) DEFAULT 0.00,
        montant_tva DECIMAL(12,2) DEFAULT 0.00,
        total_ttc DECIMAL(12,2) DEFAULT 0.00,
        statut ENUM('brouillon','emise','payee','annulee') DEFAULT 'brouillon',
        notes TEXT NULL,
        created_by INT NULL,
        entreprise_id INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY numero_facture_unique (numero_facture),
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL,
        FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE SET NULL,
        INDEX idx_factures_entreprise (entreprise_id),
        INDEX idx_factures_client (client_id),
        INDEX idx_factures_devis (devis_id),
        INDEX idx_factures_commande (commande_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS chatbot_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role ENUM('user','assistant') NOT NULL,
        contenu MEDIUMTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chatbot_messages_user (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      // NOUVELLES TABLES POUR LA GESTION DOCUMENTAIRE (migration)
      `CREATE TABLE IF NOT EXISTS documents_metier (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_document VARCHAR(50) NOT NULL,
        numero VARCHAR(50) NOT NULL,
        reference_type VARCHAR(50) DEFAULT NULL,
        reference_id INT DEFAULT NULL,
        tiers_nom VARCHAR(255) DEFAULT NULL,
        donnees JSON NOT NULL,
        montant_ht DECIMAL(12,2) DEFAULT 0,
        montant_ttc DECIMAL(12,2) DEFAULT 0,
        statut VARCHAR(30) DEFAULT 'brouillon',
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        company_id INT DEFAULT 1,
        INDEX idx_documents_metier_type (type_document),
        INDEX idx_documents_metier_numero (numero),
        INDEX idx_documents_metier_reference (reference_type, reference_id),
        INDEX idx_documents_metier_company_id (company_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS documents_historique (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_document VARCHAR(50) NOT NULL,
        document_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        details JSON DEFAULT NULL,
        performed_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        company_id INT DEFAULT 1,
        INDEX idx_documents_historique_doc (type_document, document_id),
        INDEX idx_documents_historique_company_id (company_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    ];

    for (const sql of migrations) {
      try {
        await admin.query(sql);
      } catch (err) {
        console.warn(`[MIGRATION] ${dbName}: ${err.message}`);
      }
    }
    
    console.log(`[MIGRATION] Base ${dbName} migree avec succes`);
  } finally {
    await admin.end();
  }
}

async function migrerToutesLesBasesExistantes() {
  const admin = await getAdminConnection();
  try {
    const [rows] = await admin.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'entreprise_%'"
    );
    for (const row of rows) {
      await migrerBaseExistante(row.schema_name);
    }
    console.log(`[MIGRATION] ${rows.length} bases migrees`);
  } finally {
    await admin.end();
  }
}

module.exports = {
  generateDbName,
  sanitizeForDbName,
  createTenantDatabase,
  migrerBaseExistante,
  migrerToutesLesBasesExistantes
};