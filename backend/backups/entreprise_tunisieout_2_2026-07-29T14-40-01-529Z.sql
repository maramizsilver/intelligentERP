-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: entreprise_tunisieout_2
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
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
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
  `client_id` int(11) NOT NULL,
  `date_commande` datetime DEFAULT current_timestamp(),
  `total` decimal(12,2) DEFAULT 0.00,
  `statut` enum('en_attente','confirmee','livree','annulee') DEFAULT 'en_attente',
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `commandes_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes`
--

LOCK TABLES `commandes` WRITE;
/*!40000 ALTER TABLE `commandes` DISABLE KEYS */;
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
  `date_devis` datetime DEFAULT current_timestamp(),
  `date_validite` date NOT NULL,
  `total_ht` decimal(12,2) DEFAULT 0.00,
  `total_ttc` decimal(12,2) DEFAULT 0.00,
  `remise` decimal(5,2) DEFAULT 0.00,
  `statut` enum('brouillon','envoye','accepte','refuse','expire') DEFAULT 'brouillon',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `devis_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
