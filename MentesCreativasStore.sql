-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: mentescreativasstore
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `articulos`
--

DROP TABLE IF EXISTS `articulos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `articulos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `descripcion` text,
  `foto` varchar(500) DEFAULT NULL,
  `descuento` decimal(5,2) DEFAULT '0.00',
  `ranking` decimal(3,2) DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articulos`
--

LOCK TABLES `articulos` WRITE;
/*!40000 ALTER TABLE `articulos` DISABLE KEYS */;
INSERT INTO `articulos` VALUES (2,'Polera',10000.00,'Polera sin mangas','/img/articulos/articulo-1759202291409.png',0.00,0.00),(3,'Camisa',20000.00,'Camisa normal manga corta','/img/articulos/articulo-1759262088006.png',0.00,0.00),(6,'AlgodónMaestro',20000.00,'Es algodón puro.','/img/articulos/articulo-1759678823799.jpg',5.00,0.00),(8,'Sombrero',12.00,'12','/img/articulos/articulo-1759679303359.png',0.00,0.00);
/*!40000 ALTER TABLE `articulos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `boletas`
--

DROP TABLE IF EXISTS `boletas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boletas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pedido_id` bigint NOT NULL,
  `nombre_responsable` varchar(200) NOT NULL,
  `rut_responsable` varchar(50) NOT NULL,
  `razon_social` varchar(200) NOT NULL,
  `direccion_casa_matriz` varchar(255) NOT NULL,
  `telefono_contacto` varchar(50) NOT NULL,
  `gmail` varchar(150) NOT NULL,
  `direccion_web` varchar(200) DEFAULT NULL,
  `fecha_emision` datetime NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  CONSTRAINT `fk_boleta_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boletas`
--

LOCK TABLES `boletas` WRITE;
/*!40000 ALTER TABLE `boletas` DISABLE KEYS */;
INSERT INTO `boletas` VALUES (1,1,'N/A','N/A','N/A','Santiago','+569887','superadmin@gmail.com',NULL,'2025-10-27 21:18:07',7990.00);
/*!40000 ALTER TABLE `boletas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carrito_disenos`
--

DROP TABLE IF EXISTS `carrito_disenos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito_disenos` (
  `carrito_id` bigint NOT NULL,
  `diseno_id` bigint NOT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`carrito_id`,`diseno_id`),
  KEY `fk_cd_diseno` (`diseno_id`),
  CONSTRAINT `fk_cd_carrito` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cd_diseno` FOREIGN KEY (`diseno_id`) REFERENCES `disenos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrito_disenos`
--

LOCK TABLES `carrito_disenos` WRITE;
/*!40000 ALTER TABLE `carrito_disenos` DISABLE KEYS */;
INSERT INTO `carrito_disenos` VALUES (2,2,1),(3,3,1);
/*!40000 ALTER TABLE `carrito_disenos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carritos`
--

DROP TABLE IF EXISTS `carritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carritos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `cantidad_disenos` int DEFAULT '0',
  `costo` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `fk_carritos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carritos`
--

LOCK TABLES `carritos` WRITE;
/*!40000 ALTER TABLE `carritos` DISABLE KEYS */;
INSERT INTO `carritos` VALUES (1,1,1,2500.00),(2,2,1,1500.00),(3,3,1,1200.00),(5,11,0,0.00),(6,12,0,0.00),(7,13,0,0.00);
/*!40000 ALTER TABLE `carritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_mantenedor`
--

DROP TABLE IF EXISTS `categorias_mantenedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_mantenedor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `permiso_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permiso_id` (`permiso_id`),
  CONSTRAINT `categorias_mantenedor_ibfk_1` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_mantenedor`
--

LOCK TABLES `categorias_mantenedor` WRITE;
/*!40000 ALTER TABLE `categorias_mantenedor` DISABLE KEYS */;
INSERT INTO `categorias_mantenedor` VALUES (1,'USUARIOS',6),(2,'PAGINA',9),(3,'TESTIMONIOS',13),(4,'PRODUCTOS',14),(5,'INFORMES',18);
/*!40000 ALTER TABLE `categorias_mantenedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentarios`
--

DROP TABLE IF EXISTS `comentarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `articulo_id` bigint NOT NULL,
  `comentario` text NOT NULL,
  `estado` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `articulo_id` (`articulo_id`),
  CONSTRAINT `fk_com_articulo` FOREIGN KEY (`articulo_id`) REFERENCES `articulos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_com_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentarios`
--

LOCK TABLES `comentarios` WRITE;
/*!40000 ALTER TABLE `comentarios` DISABLE KEYS */;
INSERT INTO `comentarios` VALUES (1,3,2,'Buena calidad y entrega rápida, recomendado.',1),(2,1,3,'Probé el artículo en un mockup y quedó excelente.',1),(3,2,6,'Tal vez mejorar el acabado en el borde.',1),(4,3,8,'Producto OK, pero la talla venía un poco ajustada.',1);
/*!40000 ALTER TABLE `comentarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_pagina`
--

DROP TABLE IF EXISTS `configuracion_pagina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_pagina` (
  `id` int NOT NULL AUTO_INCREMENT,
  `logo_url` varchar(255) DEFAULT NULL,
  `telefono1` varchar(20) DEFAULT NULL,
  `telefono2` varchar(20) DEFAULT NULL,
  `color1` varchar(20) DEFAULT NULL,
  `color2` varchar(20) DEFAULT NULL,
  `color3` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `correo_contacto` varchar(100) DEFAULT NULL,
  `instagram_url` varchar(255) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT '1',
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_pagina`
--

LOCK TABLES `configuracion_pagina` WRITE;
/*!40000 ALTER TABLE `configuracion_pagina` DISABLE KEYS */;
INSERT INTO `configuracion_pagina` VALUES (1,'/img/Logo.png','+569887','+569','#006A71','#9ACBD0','#F2EFE7','Santiago','contacto@mentescreativas.com','https://www.instagram.com/mentes___creativas_/',1,'2025-10-05 15:48:46');
/*!40000 ALTER TABLE `configuracion_pagina` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disenios_base`
--

DROP TABLE IF EXISTS `disenios_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disenios_base` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `frente` varchar(500) DEFAULT NULL,
  `espalda` varchar(500) DEFAULT NULL,
  `izquierda` varchar(500) DEFAULT NULL,
  `derecha` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disenios_base`
--

LOCK TABLES `disenios_base` WRITE;
/*!40000 ALTER TABLE `disenios_base` DISABLE KEYS */;
INSERT INTO `disenios_base` VALUES (1,'PoleraAmarilla','/img/disenios_base/PoleraAmarillaFront.png','/img/disenios_base/PoleraAmarillaBack.png','/img/disenios_base/PoleraAmarillaLeft.png','/img/disenios_base/PoleraAmarillaRight.png'),(2,'PoleraAzul','/img/disenios_base/PoleraAzulFront.png','/img/disenios_base/PoleraAzulBack.png','/img/disenios_base/PoleraAzulLeft.png','/img/disenios_base/PoleraAzulRight.png'),(3,'PoleraRoja','/img/disenios_base/PoleraRojaFront.png','/img/disenios_base/PoleraRojaBack.png','/img/disenios_base/PoleraRojaLeft.png','/img/disenios_base/PoleraRojaRight.png');
/*!40000 ALTER TABLE `disenios_base` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disenos`
--

DROP TABLE IF EXISTS `disenos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disenos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `objeto_id` bigint NOT NULL,
  `nombre` varchar(150) NOT NULL DEFAULT 'Diseño sin nombre',
  `elementos_por_vista` json DEFAULT NULL,
  `vista_actual` varchar(50) DEFAULT 'frente',
  `imagen_preview` mediumtext DEFAULT NULL,
  `costo` decimal(10,2) DEFAULT '0.00',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `objeto_id` (`objeto_id`),
  CONSTRAINT `fk_disenos_objeto` FOREIGN KEY (`objeto_id`) REFERENCES `objetos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_disenos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disenos`
--

LOCK TABLES `disenos` WRITE;
/*!40000 ALTER TABLE `disenos` DISABLE KEYS */;
/*!40000 ALTER TABLE `disenos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disenos_pedido`
--

DROP TABLE IF EXISTS `disenos_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disenos_pedido` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pedido_id` bigint NOT NULL,
  `usuario_id` int NOT NULL,
  `objeto_id` bigint NOT NULL,
  `nombre_diseno` varchar(150) NOT NULL DEFAULT 'Diseño sin nombre',
  `datos` json NOT NULL,
  `costo` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `objeto_id` (`objeto_id`),
  CONSTRAINT `fk_dp_objeto` FOREIGN KEY (`objeto_id`) REFERENCES `objetos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dp_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dp_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disenos_pedido`
--

LOCK TABLES `disenos_pedido` WRITE;
/*!40000 ALTER TABLE `disenos_pedido` DISABLE KEYS */;
INSERT INTO `disenos_pedido` VALUES (1,1,1,3,'Polera','{\"name\": \"Polera\", \"image\": \"/img/disenos/diseno-1-img1.png\", \"product_id\": 2}',5000.00);
/*!40000 ALTER TABLE `disenos_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `envio_eventos`
--

DROP TABLE IF EXISTS `envio_eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `envio_eventos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `envio_id` bigint NOT NULL,
  `estado` varchar(50) NOT NULL,
  `detalle` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `envio_idx` (`envio_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `envio_eventos`
--

LOCK TABLES `envio_eventos` WRITE;
/*!40000 ALTER TABLE `envio_eventos` DISABLE KEYS */;
INSERT INTO `envio_eventos` VALUES (1,1,'pendiente','Envío registrado','2025-10-28 00:18:07'),(2,1,'entregado','Actualizado por mantenedor','2025-10-28 00:18:48');
/*!40000 ALTER TABLE `envio_eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `envios`
--

DROP TABLE IF EXISTS `envios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `envios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pedido_id` bigint NOT NULL,
  `metodo` varchar(30) DEFAULT NULL,
  `receptor_nombre` varchar(100) DEFAULT NULL,
  `receptor_telefono` varchar(50) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `comuna` varchar(100) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `instrucciones` varchar(255) DEFAULT NULL,
  `costo_envio` decimal(10,2) DEFAULT '0.00',
  `carrier` varchar(50) DEFAULT NULL,
  `tracking` varchar(100) DEFAULT NULL,
  `tracking_url` varchar(255) DEFAULT NULL,
  `estado_envio` varchar(30) DEFAULT 'pendiente',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `envios`
--

LOCK TABLES `envios` WRITE;
/*!40000 ALTER TABLE `envios` DISABLE KEYS */;
INSERT INTO `envios` VALUES (1,1,'delivery','Valentina','+56 9 9882 8958','Av. Central 123, Santiago','Santiago','Santiago','Tarapacá','A42',2990.00,NULL,NULL,NULL,'entregado','2025-10-28 00:18:07');
/*!40000 ALTER TABLE `envios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluaciones`
--

DROP TABLE IF EXISTS `evaluaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluaciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `articulo_id` bigint NOT NULL,
  `estrellas` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `articulo_id` (`articulo_id`),
  CONSTRAINT `fk_eval_articulo` FOREIGN KEY (`articulo_id`) REFERENCES `articulos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eval_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluaciones_chk_1` CHECK ((`estrellas` between 0 and 10))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluaciones`
--

LOCK TABLES `evaluaciones` WRITE;
/*!40000 ALTER TABLE `evaluaciones` DISABLE KEYS */;
INSERT INTO `evaluaciones` VALUES (1,3,2,9),(2,1,3,8),(3,2,6,7),(4,3,8,10);
/*!40000 ALTER TABLE `evaluaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pedido_id` bigint NOT NULL,
  `nombre_responsable` varchar(200) NOT NULL,
  `rut_responsable` varchar(50) NOT NULL,
  `razon_social` varchar(200) NOT NULL,
  `direccion_casa_matriz` varchar(255) NOT NULL,
  `telefono_contacto` varchar(50) NOT NULL,
  `nombre_cliente` varchar(200) NOT NULL,
  `rut_cliente` varchar(50) NOT NULL,
  `giro` varchar(150) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `comuna` varchar(100) NOT NULL,
  `telefono` varchar(50) NOT NULL,
  `ciudad` varchar(100) NOT NULL,
  `referencia` text,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  CONSTRAINT `fk_factura_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objeto_variante`
--

DROP TABLE IF EXISTS `objeto_variante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objeto_variante` (
  `objeto_id` bigint NOT NULL,
  `variante_id` bigint NOT NULL,
  PRIMARY KEY (`objeto_id`,`variante_id`),
  KEY `variante_id` (`variante_id`),
  CONSTRAINT `objeto_variante_ibfk_1` FOREIGN KEY (`objeto_id`) REFERENCES `objetos` (`id`),
  CONSTRAINT `objeto_variante_ibfk_2` FOREIGN KEY (`variante_id`) REFERENCES `variantes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objeto_variante`
--

LOCK TABLES `objeto_variante` WRITE;
/*!40000 ALTER TABLE `objeto_variante` DISABLE KEYS */;
INSERT INTO `objeto_variante` VALUES (4,1),(3,2),(6,2),(4,3),(6,5),(3,6);
/*!40000 ALTER TABLE `objeto_variante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objetos`
--

DROP TABLE IF EXISTS `objetos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objetos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `articulo_id` bigint NOT NULL,
  `existencias` int DEFAULT '0',
  `precio` decimal(10,2) DEFAULT NULL,
  `disenio_base_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `articulo_id` (`articulo_id`),
  KEY `disenio_base_id` (`disenio_base_id`),
  CONSTRAINT `objetos_ibfk_1` FOREIGN KEY (`articulo_id`) REFERENCES `articulos` (`id`),
  CONSTRAINT `objetos_ibfk_2` FOREIGN KEY (`disenio_base_id`) REFERENCES `disenios_base` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objetos`
--

LOCK TABLES `objetos` WRITE;
/*!40000 ALTER TABLE `objetos` DISABLE KEYS */;
INSERT INTO `objetos` VALUES (3,2,10,5000.00,2),(4,2,10,15000.00,3),(6,2,10,12000.00,1);
/*!40000 ALTER TABLE `objetos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `carrito_id` bigint DEFAULT NULL,
  `costo` decimal(10,2) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(50) DEFAULT 'pagado',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `carrito_id` (`carrito_id`),
  CONSTRAINT `fk_pedidos_carrito` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (1,1,1,7990.00,'2025-10-27 21:18:04','pagado');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES (1,'ver_productos'),(2,'comprar_productos'),(3,'personalizar_productos'),(4,'dejar_comentarios'),(5,'ver_mantenedor'),(6,'ver_usuarios'),(7,'gestionar_roles'),(8,'moderar_usuarios'),(9,'ver_pagina'),(10,'configurar_pagina'),(11,'desconectar_pagina'),(12,'cambiar_colores'),(13,'editar_testimonios'),(14,'editar_productos'),(15,'agregar_productos'),(16,'eliminar_productos'),(17,'gestionar_descuentos'),(18,'ver_informes'),(19,'gestionar_pedidos');
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personas`
--

DROP TABLE IF EXISTS `personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `nombre_real` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_usuario_persona` (`usuario_id`),
  CONSTRAINT `fk_persona_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personas`
--

LOCK TABLES `personas` WRITE;
/*!40000 ALTER TABLE `personas` DISABLE KEYS */;
INSERT INTO `personas` VALUES (1,1,'Valentina','Rojas Silva','1990-04-12','+56 9 9882 8958','Av. Central 123, Santiago','Santiago','Tarapacá'),(2,2,'Francisco','Maldonado Pérez','1985-11-02',NULL,'Calle Los Olmos 456, Santiago',NULL,NULL),(3,3,'Carolina','Gómez Rivas','1995-07-21',NULL,'Pasaje Norte 789, Santiago',NULL,NULL),(4,11,'Camisa','Olguín Bugueño','2002-02-19','+56 9 9882 8958','Calle 13','Santiago','Tarapacá'),(5,12,'Camisa','Olguín Bugueño','2025-10-25','+56 9 9882 8958','Calle 13','Santiago','Maule'),(6,13,'Camisa','Olguín Bugueño','2025-09-23','+56 9 9882 8958','Calle 13','Santiago','La Araucanía');
/*!40000 ALTER TABLE `personas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol_permisos`
--

DROP TABLE IF EXISTS `rol_permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol_permisos` (
  `rol_id` int NOT NULL,
  `permiso_id` int NOT NULL,
  PRIMARY KEY (`rol_id`,`permiso_id`),
  KEY `permiso_id` (`permiso_id`),
  CONSTRAINT `rol_permisos_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `rol_permisos_ibfk_2` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol_permisos`
--

LOCK TABLES `rol_permisos` WRITE;
/*!40000 ALTER TABLE `rol_permisos` DISABLE KEYS */;
INSERT INTO `rol_permisos` VALUES (1,1),(2,1),(1,2),(2,2),(1,3),(2,3),(3,3),(1,4),(2,4),(2,5),(3,5),(2,6),(2,7),(2,8),(2,9),(4,9),(2,10),(4,10),(2,11),(4,11),(2,12),(4,12),(2,13),(2,14),(2,15),(2,16),(2,17),(2,18),(2,19);
/*!40000 ALTER TABLE `rol_permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'cliente'),(2,'superadmin'),(3,'admin'),(4,'admin_productos'),(5,'baneado');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subcategorias_mantenedor`
--

DROP TABLE IF EXISTS `subcategorias_mantenedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subcategorias_mantenedor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoria_id` int DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `permiso_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  KEY `permiso_id` (`permiso_id`),
  CONSTRAINT `subcategorias_mantenedor_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_mantenedor` (`id`),
  CONSTRAINT `subcategorias_mantenedor_ibfk_2` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subcategorias_mantenedor`
--

LOCK TABLES `subcategorias_mantenedor` WRITE;
/*!40000 ALTER TABLE `subcategorias_mantenedor` DISABLE KEYS */;
INSERT INTO `subcategorias_mantenedor` VALUES (1,1,'cuentas',8),(2,1,'roles',7),(3,2,'configuracion',10),(4,2,'conexion',11),(5,2,'colores',12),(6,3,'testimonios',13),(7,4,'articulos',15),(8,5,'estadisticas',18),(9,5,'articulos',18),(10,4,'pedidos',19);
/*!40000 ALTER TABLE `subcategorias_mantenedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testimonios`
--

DROP TABLE IF EXISTS `testimonios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testimonios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(25) NOT NULL,
  `calificacion` tinyint NOT NULL,
  `descripcion` text NOT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testimonios`
--

LOCK TABLES `testimonios` WRITE;
/*!40000 ALTER TABLE `testimonios` DISABLE KEYS */;
INSERT INTO `testimonios` VALUES (1,'Vieja Seca - Banda',5,'Estamparon las poleras y polerones para nuestra banda en solo un par de días. La calidad y rapidez fueron increíbles, ¡totalmente recomendados!','/img/testimonios/testimonio1.png','2025-08-24 16:58:48','2025-08-24 18:01:39'),(2,'Rvvt',5,'Gracias por los bellos polerones a Mentes Creativas!!!','/img/testimonios/testimonio2.png','2025-08-24 18:35:53','2025-09-11 22:09:29'),(6,'Francisco Santander',5,'¡Muchas gracias por la página!','/img/testimonios/testimonio3.png','2025-08-26 20:06:04','2025-09-22 23:33:32');
/*!40000 ALTER TABLE `testimonios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `rol_id` int DEFAULT NULL,
  `verificado` tinyint(1) DEFAULT '0',
  `verificacion_token` varchar(64) DEFAULT NULL,
  `verificacion_expira` datetime DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'superadmin','superadmin@gmail.com','$2a$10$ElttXEchpfV8xoMSjkCDoeO1ARp2MLWC2V6/qtnuXegZV2nQgoDX6',2,1,NULL,NULL,'2025-08-08 00:01:28','2025-10-27 02:46:58'),(2,'admin','admin@gmail.com','$2a$10$ElttXEchpfV8xoMSjkCDoeO1ARp2MLWC2V6/qtnuXegZV2nQgoDX6',3,0,NULL,NULL,'2025-08-08 00:01:28','2025-10-21 00:49:27'),(3,'cliente','cliente@gmail.com','$2a$10$ElttXEchpfV8xoMSjkCDoeO1ARp2MLWC2V6/qtnuXegZV2nQgoDX6',1,0,NULL,NULL,'2025-08-08 00:01:28','2025-10-21 00:49:27'),(11,'camisilla','kansaitopapu@gmail.com','$2b$10$CyDe2uJeue2a.MHEyhg8BuCeoZ2iiw0NDFKHRA1Y91JwTEZnf1Zem',1,0,NULL,NULL,'2025-10-24 06:11:34','2025-10-25 23:42:47'),(12,'hipolito','roblade2002@gmail.com','$2b$10$T1nk0jJ7G.225Wk33FpJs.GnNDj4bG1mAP/E9jqLaocXhBMJk6ov.',1,0,NULL,NULL,'2025-10-27 02:12:31','2025-10-27 02:12:31'),(13,'rec0ner','reconer2002@gmail.com','$2b$10$iSbg3R/TMHuQ/KojGIonT.x5LJapVlfFnBjaSkBALFgkoLHYwCR0q',1,1,NULL,NULL,'2025-10-27 03:26:34','2025-10-27 03:27:05');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variantes`
--

DROP TABLE IF EXISTS `variantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variantes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `articulo_id` bigint NOT NULL,
  `nombre_categoria` varchar(100) NOT NULL,
  `valor` varchar(100) NOT NULL,
  `imagen` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `articulo_id` (`articulo_id`),
  CONSTRAINT `variantes_ibfk_1` FOREIGN KEY (`articulo_id`) REFERENCES `articulos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variantes`
--

LOCK TABLES `variantes` WRITE;
/*!40000 ALTER TABLE `variantes` DISABLE KEYS */;
INSERT INTO `variantes` VALUES (1,2,'Color','Rojo','/img/variantes/variante-1759205949581.png'),(2,2,'Color','Azul','/img/variantes/variante-1759207117116.png'),(3,2,'Talla','XS',NULL),(4,2,'Talla','S',NULL),(5,2,'Talla','M',NULL),(6,2,'Talla','XL',NULL),(12,6,'Tamaño','Chico','/img/variantes/variante-1759679162285.png'),(13,6,'Tamaño','Maestro','/img/variantes/variante-1759679171029.jpg'),(14,6,'Color','Azul',NULL),(15,6,'Color','Rojo',NULL),(16,6,'Color','Amarillo',NULL);
/*!40000 ALTER TABLE `variantes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-27 21:27:10