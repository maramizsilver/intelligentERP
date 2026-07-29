-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: erp_db
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
  `user_agent` varchar(255) DEFAULT NULL,
  `status` enum('success','failed','locked') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_utilisateur` (`utilisateur_id`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_connexions`
--

LOCK TABLES `audit_connexions` WRITE;
/*!40000 ALTER TABLE `audit_connexions` DISABLE KEYS */;
INSERT INTO `audit_connexions` VALUES (1,6,'test@example.com','127.0.0.1','Mozilla/5.0','success','2026-07-24 13:12:48'),(2,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-24 13:25:54'),(3,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-24 13:26:29'),(4,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-24 13:27:05'),(5,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-24 13:33:27'),(6,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-24 13:33:47'),(7,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-24 13:37:37'),(8,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-24 13:50:23'),(9,6,'salhimaram359@gmail.com','::1','PostmanRuntime/7.54.0','success','2026-07-27 11:34:41'),(10,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-27 11:44:13'),(11,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:09:02'),(12,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:32:34'),(13,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:49:51'),(14,NULL,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 12:32:07'),(15,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:32:26'),(16,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:33:46'),(17,NULL,'test3@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 12:37:31'),(18,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:37:49'),(19,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:49:00'),(20,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:50:06'),(21,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:50:34'),(22,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:50:58'),(23,6,'salhimaram359@gmail.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:51:35'),(24,NULL,'a6755765cb36f5869ebb0156bc3ac8fc:ceba4fb6856c9a0233e9c1685dfe555a:e2b6a0b44d2ee36198fc9a67e356cde6133f5abf8d919b2f','::1','PostmanRuntime/7.54.0','failed','2026-07-28 14:04:08'),(25,NULL,'d182111a8ed3f44e39f122d5f40ba516:45f63a85e28d6a421148127eee83c6da:01dd128622ef282bee674e0de9b21ebe68f23f3e14fd92a3','::1','PostmanRuntime/7.54.0','failed','2026-07-28 14:04:57'),(26,NULL,'a89c4c6d5f2343bc8f3d4fb650d2db43:9beca49313dbbcc65d8e627fba51120f:568dc40490b2e3bc0c0eb089b6a3285036a3f4fec5d47cae','::1','PostmanRuntime/7.54.0','failed','2026-07-28 14:04:59'),(27,NULL,'e2280889f3421905820d67b6722c1831:c005ce1fbf37b9b06885daef2db282ad:ac3fe4556508ec4dc27d75d44c2e5b178bf78573db404d1c','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 14:10:10'),(28,NULL,'d10822b00c973c9c31a2d32b223ad677:97e94b58d3ad1cccead4232d1e3cb9a0:77976b5affe3cfafd2683a09887ab9737fb35756168e1e00','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 14:10:46'),(29,NULL,'da4ab2de0f0c4329f9ec034022981693:82bd9dba5cfe992429004760614d3423:368c5c5715effc7202647669c1e21f00a4d7ec61e551ca','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 14:11:20'),(30,NULL,'fa765267e2332540722800fdf48c97cb:48e5f79b2749d002f4ee1bc98bab39a9:5ef0c3ca7bcdfdc92d6d700d56fe886e081988398a374d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 14:11:35'),(31,NULL,'2599cb98e95573fa6076cf24bcb666bf:d6d2bd4f6b7c5ec7b73e2b5ce0c0d466:c62be900908c2f5f6169a9479a19a8f998edbfd903a93a90','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 14:17:27'),(32,NULL,'5358a466f462f587a71bbfeb83cded60:0a4a2911ee82a681a077f078dd6c4bf2:e22e5187ea29c0d533b69a5662a882ca3e6abdea4934f728','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 14:21:31'),(33,NULL,'a0aff2befd411791cca856a5c91ffa32:20728023fa043fad7121bfdd7ad9ecb9:ce9796b66613ff2d9a9a3377257228492de9479663026859','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 14:21:51'),(34,NULL,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','failed','2026-07-28 14:25:05'),(35,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 14:25:23'),(36,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 14:37:11'),(37,1,'superadmin@benjeddou.com','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 14:50:50');
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
  `action` varchar(100) NOT NULL,
  `module` varchar(50) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip` varchar(50) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_entreprise` (`entreprise_id`),
  KEY `idx_utilisateur` (`utilisateur_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,6,'POST /api/clients','Ventes','{\"path\":\"/api/clients\",\"method\":\"POST\",\"body\":{\"nom\":\"Client Test\"},\"statusCode\":201}','127.0.0.1','Mozilla/5.0','success','2026-07-24 13:12:48'),(2,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"client_id\":\"7\",\"lignes\":[{\"produit_id\":\"3\",\"quantite\":\"4\"}]},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:32:55'),(3,3,6,'DELETE /7','Authentification','{\"path\":\"/7\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"7\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:33:35'),(4,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"ons\",\"email\":\"ons@gmail.com\",\"telephone\":\"28653147\",\"adresse\":\"Avenue Ibn Sina - Prés Hotel Elhabib\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"ons@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:33:51'),(5,3,6,'DELETE /8','Authentification','{\"path\":\"/8\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"8\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:38:29'),(6,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"ons\",\"email\":\"ons@gmail.com\",\"telephone\":\"28963569\",\"adresse\":\"Avenue Ibn Sina - Prés Hotel Elhabib\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"ons@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:38:42'),(7,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"isra\",\"email\":\"isra@gmail.com\",\"telephone\":\"28963563\",\"adresse\":\"Rue2026\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"isra@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:54:20'),(8,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"ahmed1\",\"email\":\"ahmed1@gmail.com\",\"telephone\":\"225963845\",\"adresse\":\"R6,Monastir\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"ahmed1@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:58:00'),(9,3,6,'DELETE /10','Authentification','{\"path\":\"/10\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"10\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:58:12'),(10,3,6,'DELETE /9','Authentification','{\"path\":\"/9\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"9\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:58:15'),(11,3,6,'DELETE /3','Authentification','{\"path\":\"/3\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"3\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:58:17'),(12,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"salah\",\"email\":\"salah@gmail.com\",\"telephone\":\"29638546\",\"adresse\":\"Sousse, Tunisie\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"salah@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 11:59:51'),(13,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"salah1\",\"email\":\"salah1@gmail.com\",\"telephone\":\"26589321\",\"adresse\":\"here\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"salah1@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:01:51'),(14,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"Ranim\",\"email\":\"ranimgh@gmail.com\",\"telephone\":\"23569845\",\"adresse\":\"Kasserine,Kasserine Sud\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"ranimgh@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:06:11'),(15,3,6,'DELETE /14','Authentification','{\"path\":\"/14\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"14\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:10:59'),(16,3,6,'DELETE /13','Authentification','{\"path\":\"/13\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"13\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:11:03'),(17,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"Rania\",\"email\":\"raniaghoz@gmail.com\",\"telephone\":\"21536987\",\"adresse\":\"Rue2026\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"raniaghoz@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:11:26'),(18,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"Guide\",\"email\":\"mili@gmail.com\",\"telephone\":\"29381556\",\"adresse\":\"R6,Monastir\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"mili@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:15:30'),(19,3,6,'DELETE /15','Authentification','{\"path\":\"/15\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"15\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:15:36'),(20,3,6,'DELETE /12','Authentification','{\"path\":\"/12\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"12\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:15:38'),(21,3,6,'DELETE /11','Authentification','{\"path\":\"/11\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"11\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:15:41'),(22,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"client_id\":\"16\",\"lignes\":[{\"produit_id\":\"2\",\"quantite\":1}]},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:38:05'),(23,3,6,'DELETE /2','Authentification','{\"path\":\"/2\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"2\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:44:27'),(24,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"Ben ahmed\",\"email\":\"test@gmail.com\",\"telephone\":\"29381556\",\"adresse\":\"Avenue Ibn Sina - Prés Hotel Elhabib\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"test@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:44:38'),(25,3,6,'DELETE /3','Authentification','{\"path\":\"/3\",\"method\":\"DELETE\",\"body\":{},\"query\":{},\"params\":{\"id\":\"3\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:44:44'),(26,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"mejri\",\"email\":\"test@gmail.com\",\"telephone\":\"90205683\",\"adresse\":\"R6,Monastir\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"test@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:47:01'),(27,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"fournisseur_id\":\"1\",\"date_livraison_prevue\":\"2026-08-01\",\"notes\":\"\",\"lignes\":[{\"produit_id\":\"3\",\"quantite\":1,\"prix_unitaire\":\"800.00\"}]},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:47:35'),(28,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"Ben ahmed\",\"email\":\"entreprise2@gmail.com\",\"telephone\":\"90258636\",\"adresse\":\"Kasserine,Kasserine Sud\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"entreprise2@gmail.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:48:17'),(29,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"client_id\":\"17\",\"lignes\":[{\"produit_id\":\"1\",\"quantite\":1}]},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:48:30'),(30,3,6,'PUT /6/statut','Authentification','{\"path\":\"/6/statut\",\"method\":\"PUT\",\"body\":{\"statut\":\"confirmee\"},\"query\":{},\"params\":{\"id\":\"6\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:48:34'),(31,3,6,'PUT /6/statut','Authentification','{\"path\":\"/6/statut\",\"method\":\"PUT\",\"body\":{\"statut\":\"livree\"},\"query\":{},\"params\":{\"id\":\"6\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:48:36'),(32,3,6,'PUT /6/statut','Authentification','{\"path\":\"/6/statut\",\"method\":\"PUT\",\"body\":{\"statut\":\"annulee\"},\"query\":{},\"params\":{\"id\":\"6\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:48:37'),(33,3,6,'PUT /6/statut','Authentification','{\"path\":\"/6/statut\",\"method\":\"PUT\",\"body\":{\"statut\":\"en_attente\"},\"query\":{},\"params\":{\"id\":\"6\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:48:37'),(34,3,6,'PUT /6/statut','Authentification','{\"path\":\"/6/statut\",\"method\":\"PUT\",\"body\":{\"statut\":\"confirmee\"},\"query\":{},\"params\":{\"id\":\"6\"},\"statusCode\":200,\"email\":null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 12:48:38'),(35,3,6,'POST /','Authentification','{\"path\":\"/\",\"method\":\"POST\",\"body\":{\"nom\":\"da79cc53da2e33734524a26e7f21849b:783cbd61b581a7ecd8ef2ee1637518d7:9582a56b93\",\"email\":\"ae233d70b8328e4e4e27e374b6aa1b42:51cdd192ff0cd0f74b65a89d8b6cbdbf:00869b26c4646593a5ae67ce7c7c\",\"telephone\":\"5e3b707d85881d2048d450fdc45b5ea0:1ab4730b523ef38c48ade0f0c3b50ef6:e8a651267638910c\",\"adresse\":\"dc6264816c573b48aad3d676378858ff:72bcfb00d1a702dd23f66f871a58e7fb:e221da47\"},\"query\":{},\"params\":{},\"statusCode\":201,\"email\":\"ae233d70b8328e4e4e27e374b6aa1b42:51cdd192ff0cd0f74b65a89d8b6cbdbf:00869b26c4646593a5ae67ce7c7c\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','success','2026-07-28 13:48:17');
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
  `operation` varchar(100) NOT NULL,
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `anciennes_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`anciennes_valeurs`)),
  `nouvelles_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nouvelles_valeurs`)),
  `ip` varchar(50) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_entreprise` (`entreprise_id`),
  KEY `idx_utilisateur` (`utilisateur_id`),
  KEY `idx_operation` (`operation`),
  KEY `idx_table` (`table_name`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_operations`
--

LOCK TABLES `audit_operations` WRITE;
/*!40000 ALTER TABLE `audit_operations` DISABLE KEYS */;
INSERT INTO `audit_operations` VALUES (1,3,6,'CREATE','commandes',4,NULL,'{\"client_id\":\"7\",\"total\":3200,\"lignes\":[{\"produit_id\":\"3\",\"quantite\":\"4\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:32:55'),(2,3,6,'DELETE','clients',7,'{\"id\":7,\"nom\":\"ons\",\"email\":\"e62e20105a5481cce9f046abb08b5224:99230812cadcd045d248145f5f962fd6:482a10214b8c41ec2e02b0cb27\",\"telephone\":\"f2054ea4e0c7eeaa6268e8a625a718ca:4e1825d380208b892\",\"adresse\":\"eeb8b407be15e726524125c6ad6dfe15:85d5f7dd915a9174b08f1f148fd6a554:ab14fc188de7ffb05f99050117f14aa9b40e5f929a60b06906218778ea824b87db4914b0ed\",\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:33:35'),(3,3,6,'CREATE','clients',8,NULL,'{\"nom\":\"ons\",\"email\":\"ons@gmail.com\",\"telephone\":\"28653147\",\"adresse\":\"Avenue Ibn Sina - Prés Hotel Elhabib\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:33:51'),(4,3,6,'DELETE','clients',8,'{\"id\":8,\"nom\":\"ons\",\"email\":\"8578bab04e732db7a6e9c5f2829a37bd:fa608391c5a062156a2e5db2794c2ca7:0ba7d14c5986963702ec09605b\",\"telephone\":\"1f81fddc9ab82c340a391f6e126bd773:0e85e4930a1eb76e9\",\"adresse\":\"f342c66c0dbc98dfbfe9062849aec772:ec24caf16e5c364ce134c6737ae20b2c:da7ee020572dd7abc448138513d0fd543f9078f9f0367cdb24070e12a8595645e9d34fb282\",\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:38:29'),(5,3,6,'CREATE','clients',9,NULL,'{\"nom\":\"ons\",\"email\":\"ons@gmail.com\",\"telephone\":\"28963569\",\"adresse\":\"Avenue Ibn Sina - Prés Hotel Elhabib\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:38:42'),(6,3,6,'CREATE','clients',10,NULL,'{\"nom\":\"isra\",\"email\":\"isra@gmail.com\",\"telephone\":\"28963563\",\"adresse\":\"Rue2026\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:54:20'),(7,3,6,'CREATE','clients',11,NULL,'{\"nom\":\"ahmed1\",\"email\":\"ahmed1@gmail.com\",\"telephone\":\"225963845\",\"adresse\":\"R6,Monastir\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:58:00'),(8,3,6,'DELETE','clients',10,'{\"id\":10,\"nom\":\"isra\",\"email\":null,\"telephone\":null,\"adresse\":null,\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:58:12'),(9,3,6,'DELETE','clients',9,'{\"id\":9,\"nom\":\"ons\",\"email\":null,\"telephone\":null,\"adresse\":null,\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:58:15'),(10,3,6,'DELETE','clients',3,'{\"id\":3,\"nom\":\"ahmed\",\"email\":null,\"telephone\":null,\"adresse\":null,\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:58:17'),(11,3,6,'CREATE','clients',12,NULL,'{\"nom\":\"salah\",\"email\":\"salah@gmail.com\",\"telephone\":\"29638546\",\"adresse\":\"Sousse, Tunisie\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 11:59:51'),(12,3,6,'CREATE','clients',13,NULL,'{\"nom\":\"salah1\",\"email\":\"salah1@gmail.com\",\"telephone\":\"26589321\",\"adresse\":\"here\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:01:51'),(13,3,6,'CREATE','clients',14,NULL,'{\"nom\":\"Ranim\",\"email\":\"ranimgh@gmail.com\",\"telephone\":\"23569845\",\"adresse\":\"Kasserine,Kasserine Sud\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:06:11'),(14,3,6,'DELETE','clients',14,'{\"id\":14,\"nom\":\"Ranim\",\"email\":null,\"telephone\":null,\"adresse\":null,\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:10:59'),(15,3,6,'DELETE','clients',13,'{\"id\":13,\"nom\":\"salah1\",\"email\":null,\"telephone\":null,\"adresse\":null,\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:11:03'),(16,3,6,'CREATE','clients',15,NULL,'{\"nom\":\"Rania\",\"email\":\"raniaghoz@gmail.com\",\"telephone\":\"21536987\",\"adresse\":\"Rue2026\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:11:26'),(17,3,6,'CREATE','clients',16,NULL,'{\"nom\":\"Guide\",\"email\":\"mili@gmail.com\",\"telephone\":\"29381556\",\"adresse\":\"R6,Monastir\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:15:30'),(18,3,6,'DELETE','clients',15,'{\"id\":15,\"nom\":\"Rania\",\"email\":null,\"telephone\":null,\"adresse\":null,\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:15:36'),(19,3,6,'DELETE','clients',12,'{\"id\":12,\"nom\":\"salah\",\"email\":null,\"telephone\":null,\"adresse\":null,\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:15:38'),(20,3,6,'DELETE','clients',11,'{\"id\":11,\"nom\":\"ahmed1\",\"email\":null,\"telephone\":null,\"adresse\":null,\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:15:41'),(21,3,6,'CREATE','commandes',5,NULL,'{\"client_id\":\"16\",\"total\":1200,\"lignes\":[{\"produit_id\":\"2\",\"quantite\":1}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:38:05'),(22,3,6,'DELETE','fournisseurs',2,'{\"id\":2,\"nom\":\"Fournisseur teta\",\"email\":null,\"telephone\":null,\"adresse\":null,\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:44:27'),(23,3,6,'CREATE','fournisseurs',3,NULL,'{\"nom\":\"Ben ahmed\",\"email\":\"test@gmail.com\",\"telephone\":\"29381556\",\"adresse\":\"Avenue Ibn Sina - Prés Hotel Elhabib\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:44:38'),(24,3,6,'DELETE','fournisseurs',3,'{\"id\":3,\"nom\":\"Ben ahmed\",\"email\":\"test@gmail.com\",\"telephone\":\"29381556\",\"adresse\":\"Avenue Ibn Sina - Prés Hotel Elhabib\",\"entreprise_id\":1}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:44:44'),(25,3,6,'CREATE','clients',17,NULL,'{\"nom\":\"mejri\",\"email\":\"test@gmail.com\",\"telephone\":\"90205683\",\"adresse\":\"R6,Monastir\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:47:01'),(26,3,6,'CREATE','fournisseurs',4,NULL,'{\"nom\":\"Ben ahmed\",\"email\":\"entreprise2@gmail.com\",\"telephone\":\"90258636\",\"adresse\":\"Kasserine,Kasserine Sud\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:48:17'),(27,3,6,'CREATE','commandes',6,NULL,'{\"client_id\":\"17\",\"total\":500,\"lignes\":[{\"produit_id\":\"1\",\"quantite\":1}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:48:30'),(28,3,6,'UPDATE','commandes',6,'{\"id\":6,\"client_id\":17,\"date_commande\":\"2026-07-28T12:48:30.000Z\",\"total\":\"500.00\",\"statut\":\"en_attente\",\"entreprise_id\":1}','{\"statut\":\"confirmee\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:48:34'),(29,3,6,'UPDATE','commandes',6,'{\"id\":6,\"client_id\":17,\"date_commande\":\"2026-07-28T12:48:30.000Z\",\"total\":\"500.00\",\"statut\":\"confirmee\",\"entreprise_id\":1}','{\"statut\":\"livree\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:48:36'),(30,3,6,'UPDATE','commandes',6,'{\"id\":6,\"client_id\":17,\"date_commande\":\"2026-07-28T12:48:30.000Z\",\"total\":\"500.00\",\"statut\":\"livree\",\"entreprise_id\":1}','{\"statut\":\"annulee\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:48:37'),(31,3,6,'UPDATE','commandes',6,'{\"id\":6,\"client_id\":17,\"date_commande\":\"2026-07-28T12:48:30.000Z\",\"total\":\"500.00\",\"statut\":\"annulee\",\"entreprise_id\":1}','{\"statut\":\"en_attente\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:48:37'),(32,3,6,'UPDATE','commandes',6,'{\"id\":6,\"client_id\":17,\"date_commande\":\"2026-07-28T12:48:30.000Z\",\"total\":\"500.00\",\"statut\":\"en_attente\",\"entreprise_id\":1}','{\"statut\":\"confirmee\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 12:48:38'),(33,3,6,'CREATE','clients',18,NULL,'{\"nom\":\"da79cc53da2e33734524a26e7f21849b:783cbd61b581a7ecd8ef2ee1637518d7:9582a56b93\",\"email\":\"ae233d70b8328e4e4e27e374b6aa1b42:51cdd192ff0cd0f74b65a89d8b6cbdbf:00869b26c4646593a5ae67ce7c7c\",\"telephone\":\"5e3b707d85881d2048d450fdc45b5ea0:1ab4730b523ef38c48ade0f0c3b50ef6:e8a651267638910c\",\"adresse\":\"dc6264816c573b48aad3d676378858ff:72bcfb00d1a702dd23f66f871a58e7fb:e221da47\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-28 13:48:17');
/*!40000 ALTER TABLE `audit_operations` ENABLE KEYS */;
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
  `email` varchar(255) NOT NULL,
  `db_name` varchar(255) DEFAULT NULL,
  `statut` enum('en_attente','actif','suspendu') DEFAULT 'en_attente',
  `plan_type` enum('essai','payant') DEFAULT 'essai',
  `connexions_utilisees` int(11) DEFAULT 0,
  `limite_connexions_essai` int(11) DEFAULT 30,
  `date_inscription` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entreprises`
--

LOCK TABLES `entreprises` WRITE;
/*!40000 ALTER TABLE `entreprises` DISABLE KEYS */;
INSERT INTO `entreprises` VALUES (1,'24b8ae175cf891fdf9ca27c8251d2fbf:0895b139aa9bc1a8dca8c4ebf321bf6f:891fda328edef642056c33','22d9f63097269a0b7daa226105c0050c:d99c8d382a257a288717b8c8c1c1ffe0:29dc383d25ecb944868073ccdda91a','entreprise_tunisiedrop_1','actif','essai',30,30,'2026-07-17 15:46:08'),(2,'70e9f4ea6afbdd0128ab5f7277bacde1:624656f8c61ef1356b953a002cb82a74:5d2a5e1d565170251cad','f6c786353f1eef2c17a49fe46225d141:53181dcc10ae818abf1e3ec5e8c03ceb:7dfcfc2c4b51d79543399fb2479d37','entreprise_tunisieout_2','actif','essai',4,30,'2026-07-17 21:21:12'),(3,'cd1cfee600a644bfc903dd601012e5b7:1aa8bb02c78b31fa1987be909f48b002:3a8eebdc413c9d6d','59b96bfc10ca724ae27be230f6ccef7c:06b643ed2e161b2825fa7fac6807a083:6dc10d3ab71623218562e43971c815da3edddaf99c789a','entreprise_tunisnat_3','actif','essai',6,30,'2026-07-21 13:33:54'),(7,'0247c464485cc4316840b45ad90dd84c:5c1d382c775fd83727ff8751718fb443:1973169c','749f84dd760195d67ba93564dfc7d940:5d50cbb6332d1fc04c45b622e7de16d3:3a0516c78e4a788f78755ed5f9d61d3b6b0baa675890f726','entreprise_fort_7','en_attente','payant',0,30,'2026-07-23 15:25:36');
/*!40000 ALTER TABLE `entreprises` ENABLE KEYS */;
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
-- Table structure for table `paiements_abonnement`
--

DROP TABLE IF EXISTS `paiements_abonnement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paiements_abonnement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entreprise_nom` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `stripe_session_id` varchar(255) NOT NULL,
  `statut` enum('en_attente','paye','echoue','rembourse') DEFAULT 'en_attente',
  `reference` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_stripe_session_id` (`stripe_session_id`),
  KEY `idx_statut` (`statut`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paiements_abonnement`
--

LOCK TABLES `paiements_abonnement` WRITE;
/*!40000 ALTER TABLE `paiements_abonnement` DISABLE KEYS */;
INSERT INTO `paiements_abonnement` VALUES (1,'fort','test5@gmail.com',100.00,'cs_test_a1ZetjN8gyRs5bzNvHCGmxd1ZD81tGAr1nSqT8Gzf4uj1dkHDJw8vfocug','en_attente','ABO-1784816752818','2026-07-23 15:25:52','2026-07-23 15:25:52'),(2,'fortune GO','testi5@gmail.com',100.00,'cs_test_a1t32hwXVTgKR7eBVzC2Zd3jWnYk1MbXVqzDE0bzqXObpPdnaJFcXlAuVd','en_attente','ABO-1784817116190','2026-07-23 15:31:56','2026-07-23 15:31:56');
/*!40000 ALTER TABLE `paiements_abonnement` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entreprise_id` int(11) DEFAULT NULL,
  `nom` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `est_admin_entreprise` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `entreprise_id` (`entreprise_id`),
  CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_alerts`
--

DROP TABLE IF EXISTS `security_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_alerts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `alert_type` varchar(100) DEFAULT NULL,
  `severity` varchar(20) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `is_read` tinyint(1) DEFAULT 0,
  `is_resolved` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  KEY `idx_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_alerts`
--

LOCK TABLES `security_alerts` WRITE;
/*!40000 ALTER TABLE `security_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `security_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `device_fingerprint` varchar(255) DEFAULT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `device_type` varchar(50) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `browser` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_trusted` tinyint(1) DEFAULT 0,
  `last_activity` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_active` (`user_id`,`is_active`),
  KEY `idx_token` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES (1,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZWRyb3BfMSIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NTU3ODQ2LCJleHAiOjE3ODQ2NDQyNDZ9.3_iSCEJUlmpId7Qw3GSyb4I0UYqPrln2R0sJ1IeP3vM','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 15:30:46','2026-07-20 15:30:46'),(2,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZWRyb3BfMSIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NTU3OTkxLCJleHAiOjE3ODQ2NDQzOTF9.0jDf4jfRQQozujZWv0ApU6aDIKyZzNaE3AWqJxUjnD0','5b4f412d274f3024a857264f7d85601911a32b4a8e285545858fc2d27adb886f',NULL,'ordinateur','Windows','Edge','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 15:33:12','2026-07-20 15:33:12'),(3,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZWRyb3BfMSIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NTU4ODQ3LCJleHAiOjE3ODQ2NDUyNDd9.ULvvvdxY7Sz8yuUuvhZ3qPiD0V4EiYsnr951Yek78Vs','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 15:47:28','2026-07-20 15:47:27'),(4,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZWRyb3BfMSIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NTU4ODgxLCJleHAiOjE3ODQ2NDUyODF9.fNOa7E6iDVJDaZCudqqlQBsP2Cdzg5yWgsaV2Hbm9Fk','d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 15:48:16','2026-07-20 15:48:01'),(5,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZWRyb3BfMSIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NTYwMDIwLCJleHAiOjE3ODQ2NDY0MjB9.33H4kVFGNedaSMIrCfzwseU-nfqcEq72bhHiiuBDZeE','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 16:07:01','2026-07-20 16:07:00'),(6,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZWRyb3BfMSIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NTYwMDY5LCJleHAiOjE3ODQ2NDY0Njl9.Imc91EH0VnyXNmV_0oH537ujOfM-7uAigdEU4tbZou4','d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 16:26:12','2026-07-20 16:07:49'),(7,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW50cmVwcmlzZV9pZCI6Miwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZW91dF8yIiwibWZhX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3ODQ1NjAyMTQsImV4cCI6MTc4NDY0NjYxNH0.a3hsDV5FHWm_NhG_g5jsumlvOwPTZNzSFpepjRazNkU','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 16:31:05','2026-07-20 16:10:14'),(8,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZWRyb3BfMSIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NTYxOTgzLCJleHAiOjE3ODQ2NDgzODN9.v2Dw4fH0eBSgguI8teQ3xQpaGI9fWeEVklmlcMdbhKA','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 16:39:56','2026-07-20 16:39:43'),(9,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZWRyb3BfMSIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NTYyMjI4LCJleHAiOjE3ODQ2NDg2Mjh9.JI4IXq_9OQRWy5q0p0iK_IomJ9EFaGgb09dd4W3LG4o','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 16:45:37','2026-07-20 16:43:48'),(10,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZWRyb3BfMSIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NTYyMzk1LCJleHAiOjE3ODQ2NDg3OTV9.8qLMVuzPXT1_q-W5I0w1BPcRYRnYepwZMguclIKehLY','d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 16:46:35','2026-07-20 16:46:35'),(11,2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW50cmVwcmlzZV9pZCI6MSwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjp0cnVlLCJkYl9uYW1lIjoiZW50cmVwcmlzZV90dW5pc2llZHJvcF8xIiwibWZhX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3ODQ1NjI0ODQsImV4cCI6MTc4NDY0ODg4NH0.XReTKxfFmsNsqKqGwvZFiYWPouXjQMXG4PEkEjCz4g4','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 16:48:04','2026-07-20 16:48:04'),(12,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW50cmVwcmlzZV9pZCI6Miwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZW91dF8yIiwibWZhX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3ODQ1NjM2NjIsImV4cCI6MTc4NDY1MDA2Mn0.AbGPjFeO08kJhQ3ljC1I2gpZe08pHUSx25ZqbeFtcoI','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 17:07:42','2026-07-20 17:07:42'),(13,3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW50cmVwcmlzZV9pZCI6Miwicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNpZW91dF8yIiwibWZhX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3ODQ1NjM5ODksImV4cCI6MTc4NDY1MDM4OX0.93AjLeG0xwPLPiH7U-UBvAuHG0tJ66pXI46gwHGTL1Y','d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-20 17:13:09','2026-07-20 17:13:09'),(14,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjM3Mjg3LCJleHAiOjE3ODQ3MjM2ODd9.VyycF3pq-4obL4zH-izb4lxkQOa8ZRt_n2dXRHIrNpE','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 13:34:47','2026-07-21 13:34:47'),(15,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjM4MDg1LCJleHAiOjE3ODQ3MjQ0ODV9.pakeZiC_gaqMEEBKoVUHiLsp_yyZGMvgthgNzRrD8uE','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 13:48:05','2026-07-21 13:48:05'),(16,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjM4Nzc3LCJleHAiOjE3ODQ3MjUxNzd9.CHqc8l70A9X_b8lUMEo5VyOeSC_0YjHR_D71Epd2fBs','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 13:59:37','2026-07-21 13:59:37'),(17,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjM5NTU0LCJleHAiOjE3ODQ3MjU5NTR9.v9Urrk8Ubk_SKGi1oJeAECvcA7lo2UOdc7Wku__BR10','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 14:12:34','2026-07-21 14:12:34'),(18,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjQxOTkyLCJleHAiOjE3ODQ3MjgzOTJ9.crGGqE66WSTJcXopF3cUJj0ADN94xhqq7V_5BYrfbmg','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 14:53:13','2026-07-21 14:53:12'),(19,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjQyMDYzLCJleHAiOjE3ODQ3Mjg0NjN9.-QcOBLe--6X6TyKSotEG_RUXiEi0fToPbtok5wEzOwk','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 15:03:39','2026-07-21 14:54:23'),(20,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjQyNzUzLCJleHAiOjE3ODQ3MjkxNTN9.EA89abTwTEdpw1LFXvrKvKlIBUqnfmBLmSRpnOcXA3o','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 15:11:33','2026-07-21 15:05:53'),(21,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjQzMjIwLCJleHAiOjE3ODQ3Mjk2MjB9.UXlHKwEwRD_55zclAdeuXZiHVIZzgP1qdvyUVun2UKY','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 15:13:40','2026-07-21 15:13:40'),(22,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjQzNDYxLCJleHAiOjE3ODQ3Mjk4NjF9.GdlyVmXm2kkhXuoSu8Qqhs95QVKI92GGmGGZc85N2Ss','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 15:17:42','2026-07-21 15:17:41'),(23,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjQzNDk0LCJleHAiOjE3ODQ3Mjk4OTR9.VSaw84JaIlW1aOppVzW-0qGOH5pcTbRV8LmFRGUfYtY','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 15:18:14','2026-07-21 15:18:14'),(24,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjQzOTk5LCJleHAiOjE3ODQ3MzAzOTl9.fKGFOxfKtCS9kkU1jaowdOv0-2wVHz0HeJ576K6lQUA','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 15:31:52','2026-07-21 15:26:39'),(25,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NjQ0NzQ3LCJleHAiOjE3ODQ3MzExNDd9.eOf2tcxknoUEZhBdZILP4J7eRnK0ybSsXuXL3TcDaLk','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-21 15:39:58','2026-07-21 15:39:07'),(26,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NzI1OTc0LCJleHAiOjE3ODQ4MTIzNzR9.AeqVTPBWI31sdfurYcvwrHT6KZ_lx3kUhfnJpHLHxCw','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-22 14:36:38','2026-07-22 14:12:54'),(27,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NzI3ODE0LCJleHAiOjE3ODQ4MTQyMTR9.D_nPCf4zAaxd_Ec5Yi71PuFjktLgKI9cyYi76WJbmoE','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-22 15:08:42','2026-07-22 14:43:34'),(28,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0NzMwMzA1LCJleHAiOjE3ODQ4MTY3MDV9.V3YgRoPLJxv87b1cC_9bvNcdTK4tJkaXeuembYc_dB8','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-22 15:26:08','2026-07-22 15:25:05'),(29,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0ODExMTE5LCJleHAiOjE3ODQ4OTc1MTl9.ll5FHj-l-GV5FQugH8IbaLEU7svtFwcTAWNuitbUuTQ','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-23 14:11:36','2026-07-23 13:51:59'),(30,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0ODE0NDk5LCJleHAiOjE3ODQ5MDA4OTl9.NTiw2ZlriRj0E1rgxkvXJn3cZCtUt_NXDNIxnNh_y2s','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-23 14:48:26','2026-07-23 14:48:19'),(31,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0ODE2ODkyLCJleHAiOjE3ODQ5MDMyOTJ9.oBeMECrVRPZwinav5wWT8CkIZJUAuiJBeqEw4nkEBKo','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-23 15:30:58','2026-07-23 15:28:12'),(32,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0ODk2NDkyLCJleHAiOjE3ODQ5ODI4OTJ9.FK_-Hn0_90AbjmHvjkkHUpvK8NlLKazJ7cuUtCmwvlE','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-24 13:35:05','2026-07-24 13:34:52'),(33,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0ODk4ODkzLCJleHAiOjE3ODQ5ODUyOTN9.gCcyIemZtfEjisNyAOodjnhbFlQL-VNprWl0BOjWLwI','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-24 14:15:32','2026-07-24 14:14:53'),(34,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0ODk5NTg5LCJleHAiOjE3ODQ5ODU5ODl9.aJP5jLcZPCNueig9UjbfWaANEga7EfyKpODjJVrZ51o','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-24 14:26:39','2026-07-24 14:26:29'),(35,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg0OTAwMDA3LCJleHAiOjE3ODQ5ODY0MDd9.saE4Fi5HWgq033oIjrLq74iF-OgKZA3ft4zy9PJbdGA','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-24 14:33:27','2026-07-24 14:33:27'),(36,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MTUyMDgxLCJleHAiOjE3ODUyMzg0ODF9.dllWuEhi1bKRZ-nqsDQMx6nNGYlfLZ0AgfB1GMdh7F4','ba5f301ed82ffa18147c7155e4981dad51c995cb3b153dda2ea2550f5060ccd4',NULL,'ordinateur','Inconnu','Inconnu','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-27 12:34:41','2026-07-27 12:34:41'),(37,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MTUyNjUzLCJleHAiOjE3ODUyMzkwNTN9.DqRQqMtq88_yK6rJTIGVaH8AOuxdD1XnbxILWb820R4','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-27 13:38:56','2026-07-27 12:44:13'),(38,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MjM4MzU0LCJleHAiOjE3ODUzMjQ3NTR9.35YXjKXErVhPt-LJLzRNT8JixY_EXdtGXvTTQHJy8_8','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-28 12:49:26','2026-07-28 12:32:34'),(39,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MjM5MzkxLCJleHAiOjE3ODUzMjU3OTF9.iDuk4bE5R2wDkClVZRXaDfNnKzZFhZNXAgHfmXuClz4','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-28 13:31:44','2026-07-28 12:49:51'),(40,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MjQxOTQ2LCJleHAiOjE3ODUzMjgzNDZ9.JnPf8vIK1IyXVGQ55EF7GBFXJPSGfmMM0djCARd3BmE','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-28 13:33:18','2026-07-28 13:32:26'),(41,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MjQyMjY5LCJleHAiOjE3ODUzMjg2Njl9.t_MSMU5Ma0_O309wzroxpDThGJ3xLdsblTZ1M6ktY0M','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-28 13:48:38','2026-07-28 13:37:49'),(42,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MjQzMDA2LCJleHAiOjE3ODUzMjk0MDZ9.X0wkCuS1uosORj_6YXcTb0NqS6LggJFtX9iXumGkAiY','d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-28 13:50:06','2026-07-28 13:50:06'),(43,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MjQzMDM0LCJleHAiOjE3ODUzMjk0MzR9.KS9TtpZd1mFeYveDvWgA8R6wMlOpaEzarInz3r_a6R8','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-28 13:50:36','2026-07-28 13:50:34'),(44,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MjQzMDU4LCJleHAiOjE3ODUzMjk0NTh9.jPrW2RI3rl7J3JzVCcr9vIYLk5Yz4wsqKYiKoPDlsFA','d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,0,0,'2026-07-28 13:51:02','2026-07-28 13:50:58'),(45,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiZW50cmVwcmlzZV9pZCI6Mywicm9sZV9pZCI6MSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19leHRlcm5hbCI6ZmFsc2UsImNsaWVudF9pZCI6bnVsbCwiZXNzYWlfZXhwaXJlIjpmYWxzZSwiZGJfbmFtZSI6ImVudHJlcHJpc2VfdHVuaXNuYXRfMyIsIm1mYV92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzg1MjQzMDk1LCJleHAiOjE3ODUzMjk0OTV9.HB5Ir-ynHR36P09fOK4tPlaThMNabxq5rvEMD5yJ6fw','40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows','Chrome','::1','Tunisie','Tunis',36.80650000,10.18150000,1,0,'2026-07-28 15:09:51','2026-07-28 13:51:35');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taux_reference_audit`
--

LOCK TABLES `taux_reference_audit` WRITE;
/*!40000 ALTER TABLE `taux_reference_audit` DISABLE KEYS */;
INSERT INTO `taux_reference_audit` VALUES (1,1,'CREATE',NULL,'{\"categorie\":\"TVA\",\"sous_categorie\":\"standard\",\"nom\":\"TVA Standard 20%\",\"description\":\"TVA standard 2026\",\"taux\":\"20\",\"date_debut\":\"2026-07-07\",\"date_fin\":\"2026-12-31\",\"actif\":true}',1,'2026-07-17 14:34:33'),(2,1,'UPDATE','{\"id\":1,\"categorie\":\"TVA\",\"sous_categorie\":\"standard\",\"nom\":\"TVA Standard 20%\",\"description\":\"TVA standard 2026\",\"taux\":\"20.0000\",\"date_debut\":\"2026-07-06T23:00:00.000Z\",\"date_fin\":\"2026-12-30T23:00:00.000Z\",\"actif\":1,\"version\":1,\"created_by\":1,\"updated_by\":null,\"created_at\":\"2026-07-17T13:34:33.000Z\",\"updated_at\":\"2026-07-17T13:34:33.000Z\"}','{\"categorie\":\"TVA\",\"sous_categorie\":\"standard\",\"nom\":\"TVA Standard 20%\",\"description\":\"TVA standard 2026\",\"taux\":\"20.0000\",\"date_debut\":\"2026-07-06\",\"date_fin\":\"2026-12-30\",\"actif\":true}',1,'2026-07-17 14:34:38'),(3,2,'CREATE',NULL,'{\"categorie\":\"REMISE\",\"sous_categorie\":\"standard\",\"nom\":\"Remise 2026\",\"description\":\"remise \",\"taux\":\"10\",\"date_debut\":\"2026-07-07\",\"date_fin\":\"2026-12-31\",\"actif\":true}',1,'2026-07-17 18:46:28');
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
INSERT INTO `taux_reference_central` VALUES (1,'TVA','standard','TVA Standard 20%','TVA standard 2026',20.0000,'2026-07-06','2026-12-30',1,2,1,1,'2026-07-17 14:34:33','2026-07-17 14:34:38'),(2,'REMISE','standard','Remise 2026','remise ',10.0000,'2026-07-07','2026-12-31',1,1,1,NULL,'2026-07-17 18:46:28','2026-07-17 18:46:28');
/*!40000 ALTER TABLE `taux_reference_central` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_connections`
--

DROP TABLE IF EXISTS `user_connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_connections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `isp` varchar(255) DEFAULT NULL,
  `network_type` varchar(50) DEFAULT NULL,
  `device_fingerprint` varchar(255) DEFAULT NULL,
  `device_type` varchar(50) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `browser` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'success',
  `risk_level` varchar(20) DEFAULT 'low',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_connections`
--

LOCK TABLES `user_connections` WRITE;
/*!40000 ALTER TABLE `user_connections` DISABLE KEYS */;
INSERT INTO `user_connections` VALUES (1,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-20 15:30:46'),(2,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'5b4f412d274f3024a857264f7d85601911a32b4a8e285545858fc2d27adb886f','ordinateur','Windows','Edge','success','low','2026-07-20 15:33:12'),(3,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-20 15:47:27'),(4,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f','ordinateur','Windows','Chrome','success','low','2026-07-20 15:48:01'),(5,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-20 16:07:00'),(6,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f','ordinateur','Windows','Chrome','success','low','2026-07-20 16:07:49'),(7,3,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-20 16:10:14'),(8,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-20 16:39:43'),(9,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-20 16:43:48'),(10,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f','ordinateur','Windows','Chrome','success','low','2026-07-20 16:46:35'),(11,2,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-20 16:48:04'),(12,3,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-20 17:07:42'),(13,3,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f','ordinateur','Windows','Chrome','success','low','2026-07-20 17:13:09'),(14,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 13:34:47'),(15,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 13:48:05'),(16,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 13:59:37'),(17,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 14:12:34'),(18,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 14:53:12'),(19,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 14:54:23'),(20,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 15:05:53'),(21,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 15:13:40'),(22,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 15:17:41'),(23,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 15:18:14'),(24,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 15:26:39'),(25,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-21 15:39:07'),(26,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-22 14:12:54'),(27,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-22 14:43:34'),(28,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-22 15:25:05'),(29,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-23 13:51:59'),(30,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-23 14:48:19'),(31,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-23 15:28:12'),(32,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-24 13:34:52'),(33,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-24 14:14:53'),(34,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-24 14:26:29'),(35,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-24 14:33:27'),(36,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'ba5f301ed82ffa18147c7155e4981dad51c995cb3b153dda2ea2550f5060ccd4','ordinateur','Inconnu','Inconnu','success','low','2026-07-27 12:34:41'),(37,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-27 12:44:13'),(38,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-28 12:32:34'),(39,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-28 12:49:51'),(40,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-28 13:32:26'),(41,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-28 13:37:49'),(42,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f','ordinateur','Windows','Chrome','success','low','2026-07-28 13:50:06'),(43,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-28 13:50:34'),(44,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f','ordinateur','Windows','Chrome','success','low','2026-07-28 13:50:58'),(45,6,NULL,'::1','Tunisie','Tunis','Tunis',36.80650000,10.18150000,NULL,NULL,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a','ordinateur','Windows','Chrome','success','low','2026-07-28 13:51:35');
/*!40000 ALTER TABLE `user_connections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_devices`
--

DROP TABLE IF EXISTS `user_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `device_fingerprint` varchar(255) NOT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `device_type` varchar(50) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `os_version` varchar(50) DEFAULT NULL,
  `browser` varchar(100) DEFAULT NULL,
  `browser_version` varchar(50) DEFAULT NULL,
  `screen_resolution` varchar(20) DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `timezone` varchar(50) DEFAULT NULL,
  `last_used` datetime DEFAULT current_timestamp(),
  `is_trusted` tinyint(1) DEFAULT 0,
  `is_blocked` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_fingerprint` (`user_id`,`device_fingerprint`),
  KEY `idx_user_blocked` (`user_id`,`is_blocked`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_devices`
--

LOCK TABLES `user_devices` WRITE;
/*!40000 ALTER TABLE `user_devices` DISABLE KEYS */;
INSERT INTO `user_devices` VALUES (1,2,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows',NULL,'Chrome',NULL,NULL,NULL,NULL,'2026-07-20 16:48:04',0,0,'2026-07-20 15:30:46'),(2,2,'5b4f412d274f3024a857264f7d85601911a32b4a8e285545858fc2d27adb886f',NULL,'ordinateur','Windows',NULL,'Edge',NULL,NULL,NULL,NULL,'2026-07-20 15:33:12',0,0,'2026-07-20 15:33:12'),(4,2,'d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f',NULL,'ordinateur','Windows',NULL,'Chrome',NULL,NULL,NULL,NULL,'2026-07-20 16:46:35',0,0,'2026-07-20 15:48:01'),(7,3,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows',NULL,'Chrome',NULL,NULL,NULL,NULL,'2026-07-20 17:07:42',0,0,'2026-07-20 16:10:14'),(13,3,'d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f',NULL,'ordinateur','Windows',NULL,'Chrome',NULL,NULL,NULL,NULL,'2026-07-20 17:13:09',0,0,'2026-07-20 17:13:09'),(14,6,'40443ab28a194ee84e5509bf12b1dca9d7a8193686c5f4a273957092a80b5c8a',NULL,'ordinateur','Windows',NULL,'Chrome',NULL,NULL,NULL,NULL,'2026-07-28 13:51:35',0,0,'2026-07-21 13:34:47'),(36,6,'ba5f301ed82ffa18147c7155e4981dad51c995cb3b153dda2ea2550f5060ccd4',NULL,'ordinateur','Inconnu',NULL,'Inconnu',NULL,NULL,NULL,NULL,'2026-07-27 12:34:41',0,0,'2026-07-27 12:34:41'),(42,6,'d8feb632b83206a8e1bb156d43103e05734cce42521ecfcea9d287eb0bc4108f',NULL,'ordinateur','Windows',NULL,'Chrome',NULL,NULL,NULL,NULL,'2026-07-28 13:50:58',0,0,'2026-07-28 13:50:06');
/*!40000 ALTER TABLE `user_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_notification_preferences`
--

DROP TABLE IF EXISTS `user_notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_notification_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `telegram_chat_id` varchar(100) DEFAULT NULL,
  `email_enabled` tinyint(1) DEFAULT 1,
  `sms_enabled` tinyint(1) DEFAULT 0,
  `whatsapp_enabled` tinyint(1) DEFAULT 0,
  `telegram_enabled` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `user_notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_notification_preferences`
--

LOCK TABLES `user_notification_preferences` WRITE;
/*!40000 ALTER TABLE `user_notification_preferences` DISABLE KEYS */;
INSERT INTO `user_notification_preferences` VALUES (1,6,'+21629381556',NULL,1,0,1,0,'2026-07-22 13:13:16');
/*!40000 ALTER TABLE `user_notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entreprise_id` int(11) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_super_admin` tinyint(1) DEFAULT 0,
  `is_external` tinyint(1) DEFAULT 0,
  `client_id` int(11) DEFAULT NULL,
  `login_attempts` int(11) DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `mfa_secret` varchar(255) DEFAULT NULL COMMENT 'Secret TOTP (base32)',
  `mfa_enabled` tinyint(1) DEFAULT 0 COMMENT 'Indique si la MFA est activee',
  `mfa_backup_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Codes de sauvegarde (10 codes)' CHECK (json_valid(`mfa_backup_codes`)),
  `mfa_verified` tinyint(1) DEFAULT 0 COMMENT 'Indique si la MFA a ete verifiee',
  `mfa_attempts` int(11) DEFAULT 0 COMMENT 'Tentatives de code MFA consecutives',
  `mfa_locked_until` timestamp NULL DEFAULT NULL COMMENT 'Verrouillage apres trop de tentatives',
  `mfa_banner_dismissed` tinyint(1) DEFAULT 0,
  `mfa_temp_secret` varchar(255) DEFAULT NULL,
  `max_sessions` int(11) DEFAULT 1,
  `session_timeout` int(11) DEFAULT 30,
  `last_password_change` datetime DEFAULT NULL,
  `password_expiry_days` int(11) DEFAULT 90,
  `is_account_locked` tinyint(1) DEFAULT 0,
  `account_lock_reason` varchar(255) DEFAULT NULL,
  `lock_expires_at` datetime DEFAULT NULL,
  `reset_token_used` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `entreprise_id` (`entreprise_id`),
  KEY `role_id` (`role_id`),
  KEY `idx_users_mfa_enabled` (`mfa_enabled`),
  KEY `idx_users_email` (`email`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,NULL,'0664d4ca6883d4be48696153a0b3e31c:d8cd16410bfe223f2b219713af7ee234:ee8a6b3488','427cdc65fe67c72deabefeaf2518db27:32a929be3c2740250ac016be7c2dd16f:8d1635f25f','superadmin@benjeddou.com','$2b$10$nzKZVeWd6oicOhrwTIB.OekLjsMaWHAaoaICwEFGCBuOz1mjlll.C',1,0,NULL,0,NULL,NULL,NULL,NULL,'2026-07-17 13:05:37',NULL,0,NULL,0,0,NULL,0,NULL,1,30,NULL,90,0,NULL,NULL,0),(2,1,1,'0b612bdf7d9a51d98f43cd599d14b5be:39a807c0e6d398cb80f42efbaf7477f8:3f1548','7c648c9990d93cbdfaa004c56d4dd068:c0a620681f679ea0a045946b746c1090:2bda09','c82fc683873deaedb52e85abf9c5d07b:f21de70321c71f19057df162665396bc:e9cee45d3a80bcbd95356a1654c07f','$2b$10$Epv639F.Yb851ffVKBPr1u8N8at36L1D7k5LxYPAOngjN0SKg4rMi',0,0,NULL,0,NULL,'2632351b3c814a20ea937c67d66fbc3c181bdaa086fb5d5bb48d7919f18cbdf0','2026-07-24 14:47:34',NULL,'2026-07-17 15:46:09','JJDVI4JKMFEU4JRDG5ADK2ZBEMTHK5SI',0,'[\"I4S4-HXWF\",\"WG7N-8DQE\",\"I1ZT-4UY1\",\"P0NF-H1TG\",\"08PW-7S1W\",\"NVL9-UXRN\",\"E2R9-8C9I\",\"GV8Z-WZGA\",\"9UYB-ES3Q\",\"JBHF-8UHG\"]',0,0,NULL,0,'JJDVI4JKMFEU4JRDG5ADK2ZBEMTHK5SI',1,30,NULL,90,0,NULL,NULL,0),(4,1,NULL,'fe3932abd7135334c66af6ef1b03a7b7:30be5068455c9d6faa8fe85a15ecd868:a434296947','e141519af59b543129845da963e8ab4c:b087ce0ab5091e2def45135fac053c25:5b1a09ab','682997e378908f0e509780917f411b23:861d234a6fc2869cd876abe9914e5730:0091d75bec387c511929cc5bc3d0','$2b$10$SUmg682ZhAV/B2jUor16tuWIDUDk9pEJpIz2rMGrDZQzmaj.MXjZ.',0,1,2,0,NULL,NULL,NULL,NULL,'2026-07-20 13:42:56',NULL,0,NULL,0,0,NULL,0,NULL,1,30,NULL,90,0,NULL,NULL,0),(5,1,2,'dba9f1c12c1b10ab4a64cca58fc7d445:c93df0f8e8621279f1e6f77c3e2fc4e6:6e5f037ee8faca9f5b','295c0217accfbca0b772d2be8d54f589:0c20f63a8e37cac2ac5aa391cacc56bf:1f20cae81a','8bd83aa4991bbc4deeb2b5cd03ac7b43:6a8422772a9e6d932f255c256a6e850e:5341c28b8fa401e3d69b87fc2b9dfee654d0a5f8ccdd4400','$2b$10$IzfJMz26OeFlJs4OHMP06.ZovqXdBVvhQXPCdq2ppl3PqGOOSS.1W',0,0,NULL,0,NULL,NULL,NULL,NULL,'2026-07-20 13:45:34',NULL,0,NULL,0,0,NULL,0,NULL,1,30,NULL,90,0,NULL,NULL,0),(6,3,1,'e38f647f10a467233b6e42f6722cd96a:8a67138bb64974a5ac2484d04c97dfa6:5d6c5a4c','d04facfdc2a9cec7f47e969603645fc1:ee9aaf9cfb1bf241f38c9a1c9df3acbc:eb982033','36c18bbad477e38b8f0c43d7d2e50c01:541e350c6aa9e88ccdf3c31d128c6f37:dba6b21bc451857ec07e10475617d6b0ee0d7dc99b95b1','$2b$10$b.b34rZNvBhH1LUpNgUGMeu0yuderumlBBORmpCF02ri/ngUCseLu',0,0,NULL,0,NULL,'7fdb165c74368b8069565ef8e6878eba6071608f54a1a57e6408a0451e4e9ee1','2026-07-24 15:40:13',NULL,'2026-07-21 13:33:55','OBVUIS2NERNUURKOMRKDQN3TM5NS6JR2',0,'[\"3V8N-QD1T\",\"JBME-KJ5T\",\"BR7J-R4F0\",\"6N2I-6IR3\",\"BWDL-REMO\",\"L09R-Q79Z\",\"JALG-XTS4\",\"2CD1-JUZR\",\"6S36-RDKE\",\"8PSR-8CL8\"]',0,0,NULL,0,'OBVUIS2NERNUURKOMRKDQN3TM5NS6JR2',1,30,NULL,90,0,NULL,NULL,0);
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

-- Dump completed on 2026-07-28 16:20:05
