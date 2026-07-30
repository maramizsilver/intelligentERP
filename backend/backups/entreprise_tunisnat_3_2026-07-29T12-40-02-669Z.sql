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
INSERT INTO `achat_produits` VALUES (1,1,2,1,1200.00,1200.00,0,1),(2,2,3,1,800.00,800.00,0,1);
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

--
-- Dumping data for table `achats`
--

LOCK TABLES `achats` WRITE;
/*!40000 ALTER TABLE `achats` DISABLE KEYS */;
INSERT INTO `achats` VALUES (1,1,'BC-202607-0001','2026-07-23 15:30:58','2026-07-30',1200.00,1200.00,'brouillon',NULL,1),(2,1,'BC-202607-0001','2026-07-28 13:47:35','2026-08-01',800.00,800.00,'brouillon',NULL,1);
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_clients_entreprise` (`entreprise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (16,'8ea0d8c9dcd2747dfec1fd15cc0801f1:9c7aea478a460479762457a9e38e35b8:a26b360e5a','74f8ef2394210517c973686685ef8bd1:bad90474a21622b3d0b4c7ce670258ec:713faec0b94bee9dfdb0d6ffe0c6','ca6baaba841cd4af20d0c9f83cfe34a7:0b8fdc4c6f5b55af2','c501c3da7fe474424bbaa87a14174f77:9a6d5101997d1a2f1cb1589aecd080f6:9ecd929c9a46920252be8f',1),(17,'9554a1f255edb295e6ebd6dcde201eef:59830325c3b3a4fe6f362f22345a5460:295ed6999f','f08fced11d05392ff5326cc5154a4978:d17ae741b9c0a8687775adf45cbda604:dd736b5509c9900cdba661ab6329','706ba025ca279c4cfa342a0a46779da4:aa29040b48af78763','b63f2dd13c6567d91d7cee5f218517cc:862f969bf2fcb27b8d1fc043879be6a1:fa9c5eb2c4eb93e43d38df',1),(18,'cdbc226bdba2ad666c91b32c01c767fd:60bfcdbcc3d91b45d3d4c2aac4aae1e1:5e4f6e3743aa554c2daa9e5de05cb1aefeba573a61040d41197253b63f2c9b9f649dcace28e66700b02418723cc80701aec6518fb92ae213f3b3f7c174f53ee28779b6b8a25dbf6936e583fa','6aeacbd882245eb3775a8e12bad3415e:605c81b1d1bbf8bbc1617211f387f72d:a4341e81a2c7ce55f5addf1f9cc1295ac0a1e83ca52c01c0c850568ff7008cfe7af6c379e7a17f3c68694b1c04e40ddf7a02147e0ed7fb5f590e82db4bf402801b318fc82119ea2627b3b8177aff83d4e0c53768498ca328126a32f8dec4','7dc9f503a9d376aa9fe5ba6433827442:d594f504d126a0704','40dede2338be6f5cac60c8c22f15b88d:a5a298f6b2ac8d244d3f302e8a1f59b9:2e7ed7f8c552a781d71b80f169ecea696b553e6aba93a7c825720edb14dae6a5c8afb6d39797fd229bd89219c8cea6cc999cdc77123ff9cc1e77bfb78e559c50e99a8ee8c9298e5fdeae',1);
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `commande_id` (`commande_id`),
  KEY `produit_id` (`produit_id`),
  CONSTRAINT `commande_produits_ibfk_1` FOREIGN KEY (`commande_id`) REFERENCES `commandes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `commande_produits_ibfk_2` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commande_produits`
--

LOCK TABLES `commande_produits` WRITE;
/*!40000 ALTER TABLE `commande_produits` DISABLE KEYS */;
INSERT INTO `commande_produits` VALUES (6,5,2,1,1200.00,1),(7,6,1,1,500.00,1);
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `idx_commandes_entreprise` (`entreprise_id`),
  CONSTRAINT `commandes_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes`
--

LOCK TABLES `commandes` WRITE;
/*!40000 ALTER TABLE `commandes` DISABLE KEYS */;
INSERT INTO `commandes` VALUES (5,16,'2026-07-28 13:38:05',1200.00,'en_attente',1),(6,17,'2026-07-28 13:48:30',500.00,'confirmee',1);
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fournisseur_id` (`fournisseur_id`),
  KEY `idx_depenses_entreprise` (`entreprise_id`),
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `idx_devis_entreprise` (`entreprise_id`),
  CONSTRAINT `devis_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devis`
--

LOCK TABLES `devis` WRITE;
/*!40000 ALTER TABLE `devis` DISABLE KEYS */;
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
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
  `type_document` enum('facture','contrat','bon_commande','devis','identite','autre') DEFAULT 'autre',
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `chemin_fichier` varchar(255) NOT NULL,
  `nom_original` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `taille_octets` int(11) NOT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_entrepots_entreprise` (`entreprise_id`)
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
-- Table structure for table `fournisseurs`
--

DROP TABLE IF EXISTS `fournisseurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fournisseurs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_fournisseurs_entreprise` (`entreprise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fournisseurs`
--

LOCK TABLES `fournisseurs` WRITE;
/*!40000 ALTER TABLE `fournisseurs` DISABLE KEYS */;
INSERT INTO `fournisseurs` VALUES (1,'d6dee0538db39489b9669fac7120be4a:2b0c908ed7bafd2a7d76cac718b14be4:6c3d74c41fedfb1b0dfe112a1af258e9ef4614dd51',NULL,NULL,NULL,1),(4,'3d7de60bdbc28d71be04c8d1eda99a87:5a80e49b5da6286d08080adf96e3d914:bcb5623fa9d0289f2e','bfc2680c56e21771f2506b5826cc1aaf:8b63a33be3ed644775c119f97b155e9c:bead7bf9df76071f4d1e7d9f129b1122d525aaca16','7747d096cb4933b76a6788c1f26cddcd:315f40df793138431','1bac7f738be6fc61a279b55622680ee0:52c6ed7dff0160cebf34c5273e9aecea:813e66b809c94d774dc2f8d81299eeeb7a515921dc39d3',1);
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs_calculs`
--

LOCK TABLES `logs_calculs` WRITE;
/*!40000 ALTER TABLE `logs_calculs` DISABLE KEYS */;
INSERT INTO `logs_calculs` VALUES (1,6,'taux_unique','taux_unique',2000.00,10.0000,365,200.00,'{\"date_debut\":\"2026-01-01T00:00:00.000Z\",\"date_fin\":\"2026-12-31T00:00:00.000Z\"}',NULL,'2026-07-28 17:03:37',1),(2,6,'taux_unique','taux_unique',25666.00,10.0000,365,2566.60,'{\"date_debut\":\"2026-01-01T00:00:00.000Z\",\"date_fin\":\"2026-12-31T00:00:00.000Z\"}',NULL,'2026-07-28 17:11:46',1);
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_transaction` (`numero_transaction`),
  KEY `idx_paiements_entreprise` (`entreprise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paiements`
--

LOCK TABLES `paiements` WRITE;
/*!40000 ALTER TABLE `paiements` DISABLE KEYS */;
INSERT INTO `paiements` VALUES (1,'TR-202607-00001','commande',2,3600.00,'stripe','cs_test_a1zgZO4iQf3wLKg4A1OFSOrREdKYtsqLH3yULDq54uB2IW8c6XxxNlvRVh','en_attente',6,'2026-07-23 14:56:41',1),(2,'TR-202607-00002','commande',2,3600.00,'stripe','cs_test_a1UfwntMLPapt8NaRzGqQljeasPQwObUlwMzDF6HyHCx9R7dDmBUIwaXbI','en_attente',6,'2026-07-23 15:01:53',1),(3,'TR-202607-00003','commande',3,1700.00,'stripe','cs_test_a1I8jkU1oP23QlqfyTj4gTTN3cmyhUKwuAU12XkDetcBLnIHDmIxZL7Vg5','en_attente',6,'2026-07-23 15:29:21',1),(4,'TR-202607-00004','achat',1,12000.00,'stripe','cs_test_a17KLwiY1SzYepqwQ7dK9H4xKkSHqVkPCJHKk4vgufUb7xqO6WYNET2yyE','en_attente',6,'2026-07-23 15:31:16',1),(6,'TR-202607-00005','commande',5,1200.00,'stripe','cs_test_a1cyhxV4EXxMjL49KUTCZ72pvecPTT6lO9tK3eAXSFwTOuFYxgRXZDXXQR','en_attente',6,'2026-07-28 13:44:10',1);
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
  `description` text DEFAULT NULL,
  `prix` decimal(12,2) NOT NULL DEFAULT 0.00,
  `quantite_stock` int(11) NOT NULL DEFAULT 0,
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_produits_entreprise` (`entreprise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produits`
--

LOCK TABLES `produits` WRITE;
/*!40000 ALTER TABLE `produits` DISABLE KEYS */;
INSERT INTO `produits` VALUES (1,'Produit A','desc produitA',500.00,20,1),(2,'Produit B','desc produit B',1200.00,17,1),(3,'Produit C','desc Produit c',800.00,50,1);
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `idx_recettes_entreprise` (`entreprise_id`),
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
  `dernier_numero_bc` int(11) NOT NULL DEFAULT 0,
  `dernier_numero_devis` int(11) NOT NULL DEFAULT 0,
  `dernier_numero_transaction` int(11) NOT NULL DEFAULT 0,
  `entreprise_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequences`
--

LOCK TABLES `sequences` WRITE;
/*!40000 ALTER TABLE `sequences` DISABLE KEYS */;
INSERT INTO `sequences` VALUES (3,0,0,0,1),(4,0,0,0,2),(5,1,0,5,3),(6,0,0,0,7);
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
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
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
INSERT INTO `taux_reference_central` VALUES (1,'TVA','standard','TVA Standard 20%','TVA standard 2026',20.0000,'2026-07-06','2026-12-30',1,2,1,NULL,'2026-07-21 13:33:55','2026-07-21 13:33:55'),(2,'REMISE','standard','Remise 2026','remise ',10.0000,'2026-07-07','2026-12-31',1,1,1,NULL,'2026-07-21 13:33:55','2026-07-21 13:33:55');
/*!40000 ALTER TABLE `taux_reference_central` ENABLE KEYS */;
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
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_external` tinyint(1) DEFAULT 0,
  `client_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `login_attempts` int(11) DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `mfa_enabled` tinyint(1) DEFAULT 0,
  `mfa_secret` varchar(255) DEFAULT NULL,
  `mfa_backup_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mfa_backup_codes`)),
  `mfa_verified` tinyint(1) DEFAULT 0,
  `mfa_attempts` int(11) DEFAULT 0,
  `mfa_locked_until` timestamp NULL DEFAULT NULL,
  `mfa_banner_dismissed` tinyint(1) DEFAULT 0,
  `reset_token_used` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'test1','test1','salhimaram359@gmail.com','$2b$10$hXjN1d.hME8OApz8qGSkmunAAonlfEAN.FJgSTJ5RYuopurGYzwcC',0,NULL,NULL,0,NULL,NULL,NULL,'2026-07-28 16:11:25','2026-07-21 12:33:55',0,NULL,NULL,0,0,NULL,0,0);
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

-- Dump completed on 2026-07-29 13:40:03
