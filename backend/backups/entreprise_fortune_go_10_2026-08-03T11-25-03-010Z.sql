-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: entreprise_fortune_go_10
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `achat_produits`
--

DROP TABLE IF EXISTS `achat_produits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `achat_produits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `achat_id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `quantite` int(11) NOT NULL DEFAULT 1,
  `prix_unitaire` decimal(12,2) NOT NULL,
  `total_ligne` decimal(12,2) NOT NULL,
  `quantite_recue` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `achat_id` (`achat_id`),
  KEY `produit_id` (`produit_id`),
  CONSTRAINT `achat_produits_ibfk_1` FOREIGN KEY (`achat_id`) REFERENCES `achats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `achat_produits_ibfk_2` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achat_produits`
--

LOCK TABLES `achat_produits` WRITE;
/*!40000 ALTER TABLE `achat_produits` DISABLE KEYS */;
/*!40000 ALTER TABLE `achat_produits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `achats`
--

DROP TABLE IF EXISTS `achats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `achats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fournisseur_id` int(11) NOT NULL,
  `numero_bc` varchar(50) NOT NULL,
  `date_commande` datetime DEFAULT current_timestamp(),
  `date_livraison_prevue` date DEFAULT NULL,
  `total_ht` decimal(12,2) DEFAULT 0.00,
  `total_ttc` decimal(12,2) DEFAULT 0.00,
  `statut` enum('brouillon','envoye','recu_partiel','recu_total','annule') DEFAULT 'brouillon',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fournisseur_id` (`fournisseur_id`),
  CONSTRAINT `achats_ibfk_1` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achats`
--

LOCK TABLES `achats` WRITE;
/*!40000 ALTER TABLE `achats` DISABLE KEYS */;
/*!40000 ALTER TABLE `achats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `archives`
--

DROP TABLE IF EXISTS `archives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `archives` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_entite` varchar(50) NOT NULL,
  `entite_id` int(11) NOT NULL,
  `donnees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`donnees`)),
  `motif` text DEFAULT NULL,
  `archived_by` int(11) DEFAULT NULL,
  `archived_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archives`
--

LOCK TABLES `archives` WRITE;
/*!40000 ALTER TABLE `archives` DISABLE KEYS */;
/*!40000 ALTER TABLE `archives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_connexions`
--

DROP TABLE IF EXISTS `audit_connexions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_connexions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'success',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_utilisateur` (`utilisateur_id`),
  KEY `idx_email` (`email`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_connexions`
--

LOCK TABLES `audit_connexions` WRITE;
/*!40000 ALTER TABLE `audit_connexions` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_connexions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entreprise_id` int(11) DEFAULT NULL,
  `utilisateur_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `module` varchar(100) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'success',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_entreprise` (`entreprise_id`),
  KEY `idx_utilisateur` (`utilisateur_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_operations`
--

DROP TABLE IF EXISTS `audit_operations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_operations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entreprise_id` int(11) DEFAULT NULL,
  `utilisateur_id` int(11) DEFAULT NULL,
  `operation` varchar(50) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int(11) DEFAULT NULL,
  `anciennes_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`anciennes_valeurs`)),
  `nouvelles_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nouvelles_valeurs`)),
  `ip` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_entreprise` (`entreprise_id`),
  KEY `idx_utilisateur` (`utilisateur_id`),
  KEY `idx_operation` (`operation`),
  KEY `idx_table` (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_operations`
--

LOCK TABLES `audit_operations` WRITE;
/*!40000 ALTER TABLE `audit_operations` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_operations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(500) NOT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `raison_sociale` varchar(255) DEFAULT NULL,
  `email` varchar(500) DEFAULT NULL,
  `telephone` varchar(500) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(20) DEFAULT NULL,
  `pays` varchar(100) DEFAULT 'Tunisie',
  `matricule_fiscal` varchar(50) DEFAULT NULL,
  `numero_cin` varchar(20) DEFAULT NULL,
  `type_client` enum('particulier','entreprise','association') DEFAULT 'particulier',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_clients_email` (`email`),
  KEY `idx_clients_telephone` (`telephone`),
  KEY `idx_clients_matricule_fiscal` (`matricule_fiscal`),
  KEY `idx_clients_numero_cin` (`numero_cin`),
  KEY `idx_clients_nom_prenom` (`nom`,`prenom`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (4,'Ben Ali','Mohamed','SARL Ben Ali','mohamed.benali@email.com','71 123 456','15 Rue de la Liberté','Tunis','1000','Tunisie','1234567/A/B/000','12345678','entreprise','Client fidele depuis 2020','2026-08-03 11:03:54','2026-08-03 11:03:54'),(5,'Trabelsi','Sarra',NULL,'sarra.trabelsi@email.com','98 765 432','3 Avenue Habib Bourguiba','Sfax','3000','Tunisie',NULL,'87654321','particulier','Contact via site web','2026-08-03 11:03:54','2026-08-03 11:03:54'),(6,'Gharbi','Ahmed','Gharbi & Fils','ahmed.gharbi@email.com','72 345 678','25 Rue du 2 Mars','Sousse','4000','Tunisie','2345678/B/C/001','23456789','entreprise','Partenaire strategique','2026-08-03 11:03:54','2026-08-03 11:03:54'),(7,'Mansouri','Leila',NULL,'leila.mansouri@email.com','96 123 789','8 Rue de la Republique','Bizerte','7000','Tunisie',NULL,'34567890','particulier',NULL,'2026-08-03 11:03:54','2026-08-03 11:03:54'),(8,'Bouazizi','Karim','Bouazizi Trading','karim.bouazizi@email.com','73 456 789','12 Rue du Commerce','Gabes','6000','Tunisie','3456789/C/D/002','45678901','entreprise','Importation de marchandises','2026-08-03 11:03:54','2026-08-03 11:03:54'),(9,'Ben Ali','Mohamed','SARL Ben Ali','mohamed.benali@email.com','71 123 456','15 Rue de la Liberté','Tunis','1000','Tunisie','1234567/A/B/000','12345678','entreprise','Client fidele depuis 2020','2026-08-03 11:05:19','2026-08-03 11:05:19'),(10,'Trabelsi','Sarra',NULL,'sarra.trabelsi@email.com','98 765 432','3 Avenue Habib Bourguiba','Sfax','3000','Tunisie',NULL,'87654321','particulier','Contact via site web','2026-08-03 11:05:19','2026-08-03 11:05:19'),(11,'Gharbi','Ahmed','Gharbi & Fils','ahmed.gharbi@email.com','72 345 678','25 Rue du 2 Mars','Sousse','4000','Tunisie','2345678/B/C/001','23456789','entreprise','Partenaire strategique','2026-08-03 11:05:19','2026-08-03 11:05:19'),(12,'Mansouri','Leila',NULL,'leila.mansouri@email.com','96 123 789','8 Rue de la Republique','Bizerte','7000','Tunisie',NULL,'34567890','particulier',NULL,'2026-08-03 11:05:19','2026-08-03 11:05:19'),(13,'Bouazizi','Karim','Bouazizi Trading','karim.bouazizi@email.com','73 456 789','12 Rue du Commerce','Gabes','6000','Tunisie','3456789/C/D/002','45678901','entreprise','Importation de marchandises','2026-08-03 11:05:19','2026-08-03 11:05:19'),(19,'f1f9ca43a16c072c2edf922e4f48f169:820f1bd2862384e87632432320489982:8d2f23e03f','7d19cc42b610d246b39f5a4f54d23886:73c06f32cca86cbd87ea1fd2dc7bf592:c8d795c4362e17f869',NULL,'2fcfe2d0e50ed3d2a13090b85f48a04d:1068b668835a5576499e03c8e80818d8:62444c3d686de7e82872dce22c3a1b','d140275b7a085d981d733e583ec55b5a:08c5064025c3e5746173e08b661b102d:432644969b904b04','e7f9345ee8d6d9ff3a157a7f6c3aaa84:1c9fb0111a7b543068fd3419e1154aae:83c88913a82cbc2bb5c427','Monastir','5000','Tunisie',NULL,'12789653122','particulier',NULL,'2026-08-03 11:09:07','2026-08-03 11:09:07');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commande_produits`
--

DROP TABLE IF EXISTS `commande_produits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `commande_produits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `commande_id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `quantite` int(11) NOT NULL DEFAULT 1,
  `prix_unitaire` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `commande_id` (`commande_id`),
  KEY `produit_id` (`produit_id`),
  CONSTRAINT `commande_produits_ibfk_1` FOREIGN KEY (`commande_id`) REFERENCES `commandes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `commande_produits_ibfk_2` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commande_produits`
--

LOCK TABLES `commande_produits` WRITE;
/*!40000 ALTER TABLE `commande_produits` DISABLE KEYS */;
/*!40000 ALTER TABLE `commande_produits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes`
--

DROP TABLE IF EXISTS `commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `commandes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_commande` varchar(50) DEFAULT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `client_id` int(11) NOT NULL,
  `date_commande` datetime DEFAULT current_timestamp(),
  `total` decimal(12,2) DEFAULT 0.00,
  `montant_ht` decimal(12,2) DEFAULT 0.00,
  `montant_tva` decimal(12,2) DEFAULT 0.00,
  `total_ttc` decimal(12,2) DEFAULT 0.00,
  `remise` decimal(5,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `statut` enum('en_attente','confirmee','livree','annulee') DEFAULT 'en_attente',
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `idx_commandes_numero` (`numero_commande`),
  KEY `idx_commandes_reference` (`reference`),
  KEY `idx_commandes_statut` (`statut`),
  CONSTRAINT `commandes_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes`
--

LOCK TABLES `commandes` WRITE;
/*!40000 ALTER TABLE `commandes` DISABLE KEYS */;
INSERT INTO `commandes` VALUES (9,'CMD-2026-001','REF-CMD-001',4,'2026-08-02 11:00:00',1200.00,1008.40,191.60,1200.00,0.00,'Commande ordinateur portable',1,'2026-08-03 11:06:30','confirmee'),(10,'CMD-2026-002','REF-CMD-002',5,'2026-08-03 09:00:00',800.00,672.27,127.73,800.00,0.00,'Commande smartphone',1,'2026-08-03 11:06:30','livree'),(11,'CMD-2026-003','REF-CMD-003',6,'2026-08-03 13:30:00',250.00,210.10,39.90,250.00,0.00,'Commande tissus',1,'2026-08-03 11:06:30','en_attente'),(12,'CMD-2026-004','REF-CMD-004',7,'2026-08-03 15:45:00',150.00,126.05,23.95,150.00,0.00,'Commande acier',1,'2026-08-03 11:06:30','confirmee');
/*!40000 ALTER TABLE `commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `depenses`
--

DROP TABLE IF EXISTS `depenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `depenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categorie` enum('fournisseur','salaire','loyer','electricite','transport','marketing','impot','autre') NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `description` text DEFAULT NULL,
  `date_depense` date NOT NULL,
  `fournisseur_id` int(11) DEFAULT NULL,
  `mode_paiement` enum('especes','cheque','virement','carte','stripe','paypal','flouci','konnect') DEFAULT NULL,
  `justificatif_document_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fournisseur_id` (`fournisseur_id`),
  CONSTRAINT `depenses_ibfk_1` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `depenses`
--

LOCK TABLES `depenses` WRITE;
/*!40000 ALTER TABLE `depenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `depenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devis`
--

DROP TABLE IF EXISTS `devis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `devis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `numero_devis` varchar(50) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `date_devis` datetime DEFAULT current_timestamp(),
  `date_validite` date NOT NULL,
  `total_ht` decimal(12,2) DEFAULT 0.00,
  `montant_tva` decimal(12,2) DEFAULT 0.00,
  `total_ttc` decimal(12,2) DEFAULT 0.00,
  `remise` decimal(5,2) DEFAULT 0.00,
  `tva` decimal(5,2) DEFAULT 0.00,
  `statut` enum('brouillon','envoye','accepte','refuse','expire') DEFAULT 'brouillon',
  `notes` text DEFAULT NULL,
  `conditions_paiement` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `idx_devis_numero` (`numero_devis`),
  KEY `idx_devis_reference` (`reference`),
  KEY `idx_devis_date_devis` (`date_devis`),
  KEY `idx_devis_statut` (`statut`),
  CONSTRAINT `devis_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devis`
--

LOCK TABLES `devis` WRITE;
/*!40000 ALTER TABLE `devis` DISABLE KEYS */;
INSERT INTO `devis` VALUES (6,4,'DEV-2026-001','REF-DEV-001','2026-08-01 10:00:00','2026-08-31',1008.40,191.60,1200.00,0.00,19.00,'envoye','Devis ordinateur portable','Paiement a 30 jours',1,'2026-08-03 11:06:43'),(7,5,'DEV-2026-002','REF-DEV-002','2026-08-02 14:30:00','2026-08-31',672.27,127.73,800.00,0.00,19.00,'accepte','Devis smartphone','Paiement comptant',1,'2026-08-03 11:06:43'),(8,6,'DEV-2026-003','REF-DEV-003','2026-08-03 09:15:00','2026-09-02',210.10,39.90,250.00,0.00,19.00,'brouillon','Devis tissus','Paiement a 45 jours',1,'2026-08-03 11:06:43'),(9,7,'DEV-2026-004','REF-DEV-004','2026-08-03 11:45:00','2026-09-02',126.05,23.95,150.00,0.00,19.00,'envoye','Devis acier inoxydable','Paiement a 30 jours',1,'2026-08-03 11:06:43'),(10,8,'DEV-2026-005','REF-DEV-005','2026-08-03 16:20:00','2026-09-02',100.80,19.20,120.00,10.00,19.00,'brouillon','Devis avec remise de 10%','Paiement a 15 jours',1,'2026-08-03 11:06:43');
/*!40000 ALTER TABLE `devis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devis_produits`
--

DROP TABLE IF EXISTS `devis_produits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `devis_produits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `devis_id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `quantite` int(11) NOT NULL DEFAULT 1,
  `prix_unitaire` decimal(12,2) NOT NULL,
  `remise_ligne` decimal(5,2) DEFAULT 0.00,
  `total_ligne` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `devis_id` (`devis_id`),
  KEY `produit_id` (`produit_id`),
  CONSTRAINT `devis_produits_ibfk_1` FOREIGN KEY (`devis_id`) REFERENCES `devis` (`id`) ON DELETE CASCADE,
  CONSTRAINT `devis_produits_ibfk_2` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devis_produits`
--

LOCK TABLES `devis_produits` WRITE;
/*!40000 ALTER TABLE `devis_produits` DISABLE KEYS */;
/*!40000 ALTER TABLE `devis_produits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `version` int(11) DEFAULT 1,
  `est_genere` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `type_document` enum('facture','contrat','bon_commande','devis','identite','autre') DEFAULT 'autre',
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `chemin_fichier` varchar(255) NOT NULL,
  `nom_original` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `taille_octets` int(11) NOT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_documents_type` (`type_document`),
  KEY `idx_documents_reference` (`reference_type`,`reference_id`),
  KEY `idx_documents_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'facture_1785752810745.docx',NULL,NULL,1,0,'2026-08-03 10:26:50','facture',NULL,NULL,'C:\\Users\\dell\\Desktop\\ERP-project\\backend\\uploads\\documents_generes\\10\\facture_1785752810745.docx','facture_1785752810745.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',1226,12,'2026-08-03 11:26:50'),(2,'facture_1785755484267.docx',NULL,NULL,1,0,'2026-08-03 11:11:24','facture',NULL,NULL,'C:\\Users\\dell\\Desktop\\ERP-project\\backend\\uploads\\documents_generes\\10\\facture_1785755484267.docx','facture_1785755484267.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',1256,12,'2026-08-03 12:11:24');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents_generes`
--

DROP TABLE IF EXISTS `documents_generes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents_generes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `type_document` varchar(50) NOT NULL,
  `modele_utilise` varchar(255) NOT NULL,
  `donnees_utilisees` longtext DEFAULT NULL CHECK (json_valid(`donnees_utilisees`)),
  `tags_manquants` varchar(500) DEFAULT NULL,
  `est_financier` tinyint(1) DEFAULT 0,
  `langue_utilisee` varchar(10) DEFAULT 'fr',
  `devise_utilisee` varchar(10) DEFAULT 'TND',
  `genere_par` int(11) DEFAULT NULL,
  `genere_le` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_documents_generes_type` (`type_document`),
  KEY `idx_documents_generes_genere_le` (`genere_le`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents_generes`
--

LOCK TABLES `documents_generes` WRITE;
/*!40000 ALTER TABLE `documents_generes` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents_generes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entrepots`
--

DROP TABLE IF EXISTS `entrepots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `entrepots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `responsable` varchar(100) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrepots`
--

LOCK TABLES `entrepots` WRITE;
/*!40000 ALTER TABLE `entrepots` DISABLE KEYS */;
/*!40000 ALTER TABLE `entrepots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entreprises`
--

DROP TABLE IF EXISTS `entreprises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `entreprises` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `raison_sociale` varchar(255) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(20) DEFAULT NULL,
  `pays` varchar(100) DEFAULT 'Tunisie',
  `telephone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `site_web` varchar(255) DEFAULT NULL,
  `matricule_fiscal` varchar(50) DEFAULT NULL,
  `registre_commerce` varchar(50) DEFAULT NULL,
  `capital_social` decimal(12,2) DEFAULT NULL,
  `numero_tva` varchar(50) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entreprises`
--

LOCK TABLES `entreprises` WRITE;
/*!40000 ALTER TABLE `entreprises` DISABLE KEYS */;
INSERT INTO `entreprises` VALUES (1,'Fortune Go Entreprise',NULL,'Adresse principale de l\'entreprise',NULL,NULL,'Tunisie','+216 00 000 000','contact@fortunego.com',NULL,'1234567/A/B/000',NULL,NULL,NULL,NULL,1,'2026-08-01 18:57:29','2026-08-01 18:57:29');
/*!40000 ALTER TABLE `entreprises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fournisseurs`
--

DROP TABLE IF EXISTS `fournisseurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fournisseurs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(500) NOT NULL,
  `raison_sociale` varchar(255) DEFAULT NULL,
  `email` varchar(500) DEFAULT NULL,
  `telephone` varchar(500) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(20) DEFAULT NULL,
  `pays` varchar(100) DEFAULT 'Tunisie',
  `matricule_fiscal` varchar(50) DEFAULT NULL,
  `numero_tva` varchar(50) DEFAULT NULL,
  `rib` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_fournisseurs_email` (`email`),
  KEY `idx_fournisseurs_telephone` (`telephone`),
  KEY `idx_fournisseurs_matricule_fiscal` (`matricule_fiscal`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fournisseurs`
--

LOCK TABLES `fournisseurs` WRITE;
/*!40000 ALTER TABLE `fournisseurs` DISABLE KEYS */;
INSERT INTO `fournisseurs` VALUES (1,'Tunisie Electro','Tunisie Electro SARL','contact@tunisieelectro.com','71 789 012','45 Rue de l\'Industrie','Tunis','1000','Tunisie','4567890/D/E/003','TV12345678','12345678901234567890','Fournisseur de materiel electronique','2026-08-03 11:04:06','2026-08-03 11:04:06'),(2,'Mediterranée Pharma','Mediterranée Pharma SA','info@medpharma.com','74 567 890','8 Rue du Medecin','Sfax','3000','Tunisie','5678901/E/F/004','TV23456789','23456789012345678901','Fournisseur de produits pharmaceutiques','2026-08-03 11:04:06','2026-08-03 11:04:06'),(3,'Star Textile','Star Textile SARL','contact@startextile.com','72 890 123','17 Rue du Textile','Monastir','5000','Tunisie','6789012/F/G/005','TV34567890','34567890123456789012','Fournisseur de tissus et vêtements','2026-08-03 11:04:06','2026-08-03 11:04:06'),(4,'Alpha Steel','Alpha Steel SA','info@alphasteel.com','75 123 456','20 Rue de la Metallurgie','Bizerte','7000','Tunisie','7890123/G/H/006','TV45678901','45678901234567890123','Fournisseur de produits metalliques','2026-08-03 11:04:06','2026-08-03 11:04:06'),(5,'Green Agro','Green Agro SARL','contact@greenagro.com','76 234 567','35 Rue de l\'Agriculture','Nabeul','8000','Tunisie','8901234/H/I/007','TV56789012','56789012345678901234','Fournisseur de produits agricoles','2026-08-03 11:04:06','2026-08-03 11:04:06');
/*!40000 ALTER TABLE `fournisseurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventaire_lignes`
--

DROP TABLE IF EXISTS `inventaire_lignes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventaire_lignes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inventaire_id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `quantite_theorique` int(11) NOT NULL DEFAULT 0,
  `quantite_comptee` int(11) DEFAULT NULL,
  `ecart` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `inventaire_id` (`inventaire_id`),
  KEY `produit_id` (`produit_id`),
  CONSTRAINT `inventaire_lignes_ibfk_1` FOREIGN KEY (`inventaire_id`) REFERENCES `inventaires` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventaire_lignes_ibfk_2` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventaire_lignes`
--

LOCK TABLES `inventaire_lignes` WRITE;
/*!40000 ALTER TABLE `inventaire_lignes` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventaire_lignes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventaires`
--

DROP TABLE IF EXISTS `inventaires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventaires` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entrepot_id` int(11) DEFAULT NULL,
  `date_creation` datetime DEFAULT current_timestamp(),
  `date_cloture` datetime DEFAULT NULL,
  `statut` enum('brouillon','en_cours','termine','annule') DEFAULT 'brouillon',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventaires`
--

LOCK TABLES `inventaires` WRITE;
/*!40000 ALTER TABLE `inventaires` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventaires` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logs_calculs`
--

DROP TABLE IF EXISTS `logs_calculs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logs_calculs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int(11) DEFAULT NULL,
  `type_calcul` varchar(50) NOT NULL,
  `type_calcul_detaille` varchar(50) NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `taux` decimal(10,4) DEFAULT NULL,
  `nb_jours` int(11) DEFAULT NULL,
  `resultat` decimal(12,2) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `taux_reference_used` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`taux_reference_used`)),
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs_calculs`
--

LOCK TABLES `logs_calculs` WRITE;
/*!40000 ALTER TABLE `logs_calculs` DISABLE KEYS */;
/*!40000 ALTER TABLE `logs_calculs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom` (`nom`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES (2,'Achats'),(6,'Documents'),(4,'Finance'),(3,'Stock'),(5,'Utilisateurs'),(1,'Ventes');
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mouvements_stock`
--

DROP TABLE IF EXISTS `mouvements_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mouvements_stock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produit_id` int(11) NOT NULL,
  `type` enum('entree','sortie','ajustement','commande_client','achat_fournisseur','inventaire') NOT NULL,
  `quantite` int(11) NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `ancien_stock` int(11) NOT NULL,
  `nouveau_stock` int(11) NOT NULL,
  `motif` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `produit_id` (`produit_id`),
  CONSTRAINT `mouvements_stock_ibfk_1` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mouvements_stock`
--

LOCK TABLES `mouvements_stock` WRITE;
/*!40000 ALTER TABLE `mouvements_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `mouvements_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocr_analyses`
--

DROP TABLE IF EXISTS `ocr_analyses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ocr_analyses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) DEFAULT NULL,
  `nom_fichier` varchar(255) NOT NULL,
  `langue_utilisee` varchar(10) DEFAULT 'fr',
  `confiance_ocr` decimal(5,2) DEFAULT NULL,
  `texte_extrait` longtext DEFAULT NULL,
  `champs_detectes` longtext DEFAULT NULL CHECK (json_valid(`champs_detectes`)),
  `analyse_par` int(11) DEFAULT NULL,
  `analyse_le` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ocr_analyses_analyse_le` (`analyse_le`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocr_analyses`
--

LOCK TABLES `ocr_analyses` WRITE;
/*!40000 ALTER TABLE `ocr_analyses` DISABLE KEYS */;
/*!40000 ALTER TABLE `ocr_analyses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paiements`
--

DROP TABLE IF EXISTS `paiements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paiements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_transaction` varchar(50) NOT NULL,
  `reference_type` enum('commande','achat') NOT NULL,
  `reference_id` int(11) NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `mode_paiement` enum('especes','cheque','virement','carte','stripe','paypal','flouci','konnect') NOT NULL,
  `provider_ref` varchar(255) DEFAULT NULL,
  `statut` enum('en_attente','valide','echoue','rembourse') DEFAULT 'en_attente',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_transaction` (`numero_transaction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paiements`
--

LOCK TABLES `paiements` WRITE;
/*!40000 ALTER TABLE `paiements` DISABLE KEYS */;
/*!40000 ALTER TABLE `paiements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `consultation` tinyint(1) DEFAULT 0,
  `creation` tinyint(1) DEFAULT 0,
  `modification` tinyint(1) DEFAULT 0,
  `suppression` tinyint(1) DEFAULT 0,
  `validation` tinyint(1) DEFAULT 0,
  `export` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_role_module` (`role_id`,`module_id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permissions_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,1,1,1,1,1,1,1,1),(2,1,2,1,1,1,1,1,1),(3,1,3,1,1,1,1,1,1),(4,1,4,1,1,1,1,1,1),(5,1,5,1,1,1,1,1,1),(6,1,6,1,1,1,1,1,1);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produits`
--

DROP TABLE IF EXISTS `produits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `produits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `code_barre` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `prix` decimal(12,2) NOT NULL DEFAULT 0.00,
  `prix_achat` decimal(12,3) DEFAULT NULL,
  `prix_vente` decimal(12,3) DEFAULT NULL,
  `prix_unitaire_ht` decimal(12,3) DEFAULT NULL,
  `tva` decimal(5,2) DEFAULT 0.00,
  `unite` varchar(20) DEFAULT 'unité',
  `categorie` varchar(100) DEFAULT NULL,
  `fournisseur_id` int(11) DEFAULT NULL,
  `seuil_alerte` int(11) DEFAULT 5,
  `actif` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `quantite_stock` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_produits_reference` (`reference`),
  KEY `idx_produits_code_barre` (`code_barre`),
  KEY `idx_produits_categorie` (`categorie`),
  KEY `idx_produits_fournisseur_id` (`fournisseur_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produits`
--

LOCK TABLES `produits` WRITE;
/*!40000 ALTER TABLE `produits` DISABLE KEYS */;
INSERT INTO `produits` VALUES (1,'Ordinateur Portable Dell XPS','DELL-XPS-001','1234567890123','Ordinateur portable Dell XPS 13',1200.00,950.000,1200.000,1008.400,19.00,'unité','Informatique',1,5,1,'2026-08-03 11:04:15','2026-08-03 11:04:15',15),(2,'Smartphone Samsung Galaxy S23','SAMS-S23-001','2345678901234','Smartphone Samsung Galaxy S23 256GB',800.00,650.000,800.000,672.270,19.00,'unité','Telephonie',1,10,1,'2026-08-03 11:04:15','2026-08-03 11:04:15',25),(3,'Tissu Coton Premium','TISS-COT-001','3456789012345','Tissu en coton 100% qualité premium',25.00,18.500,25.000,21.010,19.00,'metre','Textile',3,50,1,'2026-08-03 11:04:15','2026-08-03 11:04:15',200),(4,'Acier Inoxydable 304','ACIER-304-001','4567890123456','Tôle acier inoxydable 304 épaisseur 2mm',150.00,120.000,150.000,126.050,19.00,'kg','Metallurgie',4,20,1,'2026-08-03 11:04:15','2026-08-03 11:04:15',80),(5,'Engrais NPK','ENGRAIS-NPK-001','5678901234567','Engrais NPK 15-15-15 50kg',45.00,35.000,45.000,37.820,19.00,'sac','Agriculture',5,10,1,'2026-08-03 11:04:15','2026-08-03 11:04:15',40),(6,'Paracetamol 500mg','PARA-500-001','6789012345678','Paracetamol 500mg boite 20 comprimés',12.00,8.500,12.000,10.080,19.00,'boite','Pharma',2,15,1,'2026-08-03 11:04:15','2026-08-03 11:04:15',60),(7,'Chemise Homme','CHEM-HOM-001','7890123456789','Chemise homme en coton - col italien',35.00,22.000,35.000,29.410,19.00,'unité','Textile',3,20,1,'2026-08-03 11:04:15','2026-08-03 11:04:15',100),(8,'Plaque Aluminium','ALUM-PLA-001','8901234567890','Plaque aluminium 3mm 1m x 2m',180.00,140.000,180.000,151.260,19.00,'unité','Metallurgie',4,10,1,'2026-08-03 11:04:15','2026-08-03 11:04:15',30);
/*!40000 ALTER TABLE `produits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promotions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('pourcentage','fixe','livraison_offerte') NOT NULL,
  `valeur` decimal(12,2) NOT NULL,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  `utilisation_max` int(11) DEFAULT NULL,
  `utilisation_count` int(11) DEFAULT 0,
  `actif` tinyint(1) DEFAULT 1,
  `produits_concernes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`produits_concernes`)),
  `clients_concernes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`clients_concernes`)),
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recettes`
--

DROP TABLE IF EXISTS `recettes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recettes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source` varchar(255) NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `description` text DEFAULT NULL,
  `date_recette` date NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `mode_paiement` enum('especes','cheque','virement','carte','stripe','paypal','flouci','konnect') DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `recettes_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recettes`
--

LOCK TABLES `recettes` WRITE;
/*!40000 ALTER TABLE `recettes` DISABLE KEYS */;
/*!40000 ALTER TABLE `recettes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `est_admin_entreprise` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin Entreprise',NULL,1);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequences`
--

DROP TABLE IF EXISTS `sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sequences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entreprise_id` int(11) NOT NULL,
  `dernier_numero_bc` int(11) NOT NULL DEFAULT 0,
  `dernier_numero_devis` int(11) NOT NULL DEFAULT 0,
  `dernier_numero_transaction` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `entreprise_id` (`entreprise_id`),
  KEY `idx_entreprise` (`entreprise_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequences`
--

LOCK TABLES `sequences` WRITE;
/*!40000 ALTER TABLE `sequences` DISABLE KEYS */;
/*!40000 ALTER TABLE `sequences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_entrepot`
--

DROP TABLE IF EXISTS `stock_entrepot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_entrepot` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entrepot_id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `quantite` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_entrepot_produit` (`entrepot_id`,`produit_id`),
  KEY `produit_id` (`produit_id`),
  CONSTRAINT `stock_entrepot_ibfk_1` FOREIGN KEY (`entrepot_id`) REFERENCES `entrepots` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_entrepot_ibfk_2` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_entrepot`
--

LOCK TABLES `stock_entrepot` WRITE;
/*!40000 ALTER TABLE `stock_entrepot` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_entrepot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taux_reference_audit`
--

DROP TABLE IF EXISTS `taux_reference_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taux_reference_audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `taux_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `anciennes_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`anciennes_valeurs`)),
  `nouvelles_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nouvelles_valeurs`)),
  `modified_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taux_reference_audit`
--

LOCK TABLES `taux_reference_audit` WRITE;
/*!40000 ALTER TABLE `taux_reference_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `taux_reference_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taux_reference_central`
--

DROP TABLE IF EXISTS `taux_reference_central`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taux_reference_central` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categorie` varchar(100) NOT NULL,
  `sous_categorie` varchar(100) DEFAULT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `taux` decimal(10,4) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `version` int(11) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taux_reference_central`
--

LOCK TABLES `taux_reference_central` WRITE;
/*!40000 ALTER TABLE `taux_reference_central` DISABLE KEYS */;
INSERT INTO `taux_reference_central` VALUES (1,'TVA','standard','TVA Standard 20%','TVA standard 2026',20.0000,'2026-07-06','2026-12-30',1,2,1,NULL,'2026-07-31 16:15:12','2026-07-31 16:15:12'),(2,'REMISE','standard','Remise 2026','remise ',10.0000,'2026-07-07','2026-12-31',1,1,1,NULL,'2026-07-31 16:15:12','2026-07-31 16:15:12');
/*!40000 ALTER TABLE `taux_reference_central` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `type_document` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `chemin_fichier` varchar(255) NOT NULL,
  `est_commun` tinyint(1) DEFAULT 0,
  `est_actif` tinyint(1) DEFAULT 1,
  `tags_disponibles` longtext DEFAULT NULL CHECK (json_valid(`tags_disponibles`)),
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_templates_type` (`type_document`),
  KEY `idx_templates_est_commun` (`est_commun`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) DEFAULT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `matricule` varchar(50) DEFAULT NULL,
  `fonction` varchar(100) DEFAULT NULL,
  `service` varchar(100) DEFAULT NULL,
  `actif` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_external` tinyint(1) DEFAULT 0,
  `client_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `login_attempts` int(11) DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  `reset_token_used` tinyint(1) DEFAULT 0,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `mfa_enabled` tinyint(1) DEFAULT 0,
  `mfa_secret` varchar(255) DEFAULT NULL,
  `mfa_backup_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mfa_backup_codes`)),
  `mfa_verified` tinyint(1) DEFAULT 0,
  `mfa_attempts` int(11) DEFAULT 0,
  `mfa_locked_until` timestamp NULL DEFAULT NULL,
  `mfa_temp_secret` varchar(255) DEFAULT NULL,
  `mfa_banner_dismissed` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  KEY `idx_users_telephone` (`telephone`),
  KEY `idx_users_matricule` (`matricule`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'Rania','mili',NULL,NULL,NULL,NULL,1,'2026-08-03 10:24:56','mejrimaram359@gmail.com','$2b$10$P4Pu0T9px/7UbW62Izqoa.o5xUNmOmEoSYr/0GruzjJhsbuCubImu',0,NULL,NULL,0,NULL,NULL,NULL,0,'2026-08-03 10:24:56','2026-07-31 15:15:12',0,NULL,NULL,0,0,NULL,NULL,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-03 12:25:04
