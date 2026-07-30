-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: entreprise_tunisnat_3
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `achat_id` (`achat_id`),
  KEY `produit_id` (`produit_id`),
  CONSTRAINT `achat_produits_ibfk_1` FOREIGN KEY (`achat_id`) REFERENCES `achats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `achat_produits_ibfk_2` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fournisseur_id` (`fournisseur_id`),
  KEY `idx_achats_entreprise` (`entreprise_id`),
  CONSTRAINT `achats_ibfk_1` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
