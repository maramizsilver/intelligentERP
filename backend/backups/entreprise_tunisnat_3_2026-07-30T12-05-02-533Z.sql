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
  `nom` varchar(500) NOT NULL,
  `email` varchar(500) DEFAULT NULL,
  `telephone` varchar(500) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_clients_entreprise` (`entreprise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (28,'a0b81161685b2e4c664a3692944e3e7e:09d15ae7e40a1eabbaf2e1e3a28ad3b7:9f5f82b052f46b0cd4','eb98706cc6f79cc2080804816d9ec928:7347ccbd1eedd5f9ae14bd967152a799:c15a1e169054419579cfca79f345ee53d6b65cee8100323eec27ccc694e2448f6be11c53468483eb47db2e213613e89b27dbd05750aab607c87d550708877d4a9228947dacd74f6153b74b7e5c5a89b13141f94b4935f53c7f2f474f28eb0967e783ca1c68f84959134fff54','373c5e5083c190ec9e55b1b13488c0a9:6543bc056deaa5983f30f77609ec129c:496c20d0c58d79968ea87e5022ea00000db9ce6b1e7f8ea0e61647a07b865cfac936dbc545f35c3e692dafdfbed50d74e32a4b35b139230d08008322a44b75922804b3eeb209d5baa6a7dabd5e091884e219','1f452ca7708aa69b1c8c1003215b962b:ea6e0531f9cd58718f0d9400ba31e1e7:a3ee6e3cdf9661e97d3c163be7d697c213dd92ae099d28760b5e5f67f5bbcb5fc590199fd91c8e88a9ebc7aaf4bdf1eb3e5c19d6778049f02ac513228076d96918b5d277e7eae9ddf73fe22bdf0547203c22b1e61e3be50bf43859fd70da4bed',1),(29,'1cdf0c1814bd977991a53238b6d8a3ea:d797e97df6e1ad95e77b311bc794efa9:14cb288e8e','dbac9916964610a18180d6c6953603e7:51cb4c74240840411053d1296d203d12:40724b42aa833d45b6c929e8f2a34df078b3357cba733f17f828d063321e3f0f39d87b170301e3a32c22dc52adf716c8602944252ea3991a088487890a6db4ed108014aa1acbb9e7dfb7579dd8b7817ab21043374cdfd88e33f82727','aad073caf9298c41d3ae27df33ebff32:2e44283d42fba28052a0856812e58716:b0c392dcc33de591ea097d9016416981848b55962e22b4aa6bea12045a527d6ebeab13c0f6ea28b75618083a13564ca739466e9800dd6e1093b2ca89deb958e24d6bba11cd659d184a60ae98fb94947fd1cd','648097d0d3581c1c0c574e190c9e562e:990b8bc40f48da7602bf3fdf21492457:d6e2db865e9db926515bbabd7f3faffee5083232bbaa05a7c4d1188adc3073a7bdd2b2280c4a49b88f5a252eb3edf1c606a7d3e49043374f825307ce0ea3704bf36b122c1022f41324826cd7f5cd4c6395db2d6d5e9f0a0d',1),(30,'0179ed13b04f70ee007ee18531cfa531:bb9b8568e389436a83e79ff86882586a:b3fde5b71b','c6167083a55f881b23add84f964242d2:e0551e0f5001828cc5d517c1bedba395:d9361368cf3d805b749c224a9b22c409fabfb368734be5012a19db206b0e2759cb72e487252f3c5dd4284079805558c4bbd3da0356c6ce228fe42af7d4f75968a3a2ee3544c650f9391abc09be042e2234f143206bacb44cba78402d733d017d84e0b8b0f55dfa4cdafc','2c541cf220c4501d58e273411d496677:594abb71d119ef60a1e961109ff04a91:41c7fdf70a95ee9822f0d62a939711ffbcd7fe56e81340350183ee1b33ce26e33292a716e4fba519f1a3a4974e0937d56ac5b952214b1ed63f7d066ea71269a983bcb6e2ccef8e6fe5783fd74e81259440ae','b58e568ab5d32441a2b29672f63b71bb:41f212b6e3514726518fe76e497b931b:9d4726868cfc9a76b0ab4323675bf92607be6786af12d5ffbcf66bac206b6d59473c0b9356dd07d2b2ef3806acf419328d19b07522c8cda4b3bf5a21b377d0ac59c216c4ecc5115cc2d1618de55729a0',1);
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
  `nom` varchar(500) NOT NULL,
  `email` varchar(500) DEFAULT NULL,
  `telephone` varchar(500) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `entreprise_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_fournisseurs_entreprise` (`entreprise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fournisseurs`
--

LOCK TABLES `fournisseurs` WRITE;
/*!40000 ALTER TABLE `fournisseurs` DISABLE KEYS */;
INSERT INTO `fournisseurs` VALUES (8,'4b67c933552c9ff20d030f8846609afa:438a88341f9ac24bb3ccf19722e3e7fd:6722cd8434','8f8118e94a32f3fc47c73589e7437a81:e4513371a334fb65d0c0e384174f8b20:9ed56f13567351a6680c46c1fb540a6f42f5b4454cedb82d5df6b0524c1d7fe4265af736bf024e81e6e96be9c5df1c0e68ca7e654c9290fcde016a1ff69e9f4dda9ebcc3f302512b70d1608969bfb998f4e4548d94e84f88093862c506c5','227c4e284773343bfcd4add2c02895d5:2b6c70e245c4146ee1cf87481a9f4214:a04cead4a0727a9f8489d1c41cb75f4a095130136bd051deba6ef3b2005aee864faad61563620c8dcdf0fd8cd2e01e2f3592975c54e2dba1e4d2ab655d5d65af48f7b3958f15d82e95606afde114f9e77b16','969f883b377abe19951ac31bafe30f05:462b7136f4b1382f29f05e6dad2c92ad:c1abf824fa8001211e2c51aeccc24fba6f1bc919f9bf30b7da088809b7af1d4fc0d94f86bfac6386fccd7772699c7f705f8c4d16de12b30d992e4adb904b52853ecd54d91d97573b8b5ff4b632ef884166b0dd1aa7962f2110c779c42b2cde475156586d1bef3a023430d8b5cf4d736f',1);
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
INSERT INTO `users` VALUES (1,1,'test1','test1','salhimaram359@gmail.com','$2b$10$hXjN1d.hME8OApz8qGSkmunAAonlfEAN.FJgSTJ5RYuopurGYzwcC',0,NULL,NULL,0,NULL,NULL,NULL,'2026-07-30 12:02:10','2026-07-21 12:33:55',0,NULL,NULL,0,0,NULL,0,0);
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

-- Dump completed on 2026-07-30 13:05:03
