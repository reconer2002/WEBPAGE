-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS mentescreativasstore;
USE mentescreativasstore;
-- MANEJO DE USUARIOS 0.1
-- Tabla de usuarios
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  rol_id INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);
-- Tabla de roles de usuario (Cliente, SuperAdmin, Admin)
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) -- ejemplo: 'cliente', 'superadmin', 'admin'
);
-- Tabla de permisos por rol (SuperAdmin puede manejar el rol de Admin, Admin puede moderar la página, cliente puede comprar)
CREATE TABLE permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) -- ejemplo: 'enviar_mails', 'gestionar_productos', 'editar_usuarios'
);
-- Tabla que indica qué roles tienen qué permisos
CREATE TABLE rol_permisos (
  rol_id INT,
  permiso_id INT,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);
-- Tabla de categorías del mantenedor
CREATE TABLE categorias_mantenedor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  permiso_id INT,
  -- permiso necesario para ver esta categoría
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);
-- Tabla de subcategorías del mantenedor
CREATE TABLE subcategorias_mantenedor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT,
  nombre VARCHAR(100),
  permiso_id INT,
  -- permiso necesario para ver esta subcategoría
  FOREIGN KEY (categoria_id) REFERENCES categorias_mantenedor(id),
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);
-- Procedimiento para ver los permisos de cada rol
DELIMITER $$ CREATE PROCEDURE mostrar_roles_permisos() BEGIN
DECLARE sql_query TEXT;
SELECT GROUP_CONCAT(
    DISTINCT CONCAT(
      'MAX(CASE WHEN p.nombre = ''',
      p.nombre,
      ''' THEN ''Sí'' ELSE ''No'' END) AS `',
      p.nombre,
      '`'
    )
    ORDER BY p.id
  ) INTO sql_query
FROM permisos p;
SET @final_sql = CONCAT(
    'SELECT r.nombre AS rol, ',
    sql_query,
    ' FROM roles r
      LEFT JOIN rol_permisos rp ON r.id = rp.rol_id
      LEFT JOIN permisos p ON rp.permiso_id = p.id
      GROUP BY r.id, r.nombre
      ORDER BY r.nombre;'
  );
PREPARE stmt
FROM @final_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
END $$ DELIMITER;
-- MANTENEDOR PAGINA CONFIGURACIÓN 0.1
CREATE TABLE configuracion_pagina (
  id INT PRIMARY KEY AUTO_INCREMENT,
  logo_url VARCHAR(255),
  -- ruta o url del logo en png
  telefono1 VARCHAR(20),
  telefono2 VARCHAR(20),
  color1 VARCHAR(20),
  -- hex ej: #FF0000
  color2 VARCHAR(20),
  color3 VARCHAR(20),
  direccion VARCHAR(255),
  correo_contacto VARCHAR(100),
  instagram_url VARCHAR(255),
  estado TINYINT(1) DEFAULT 1,
  -- 1 = activa, 0 = en mantenimiento
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabla de testimonios de clientes
CREATE TABLE testimonios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(25) NOT NULL,
  -- nombre del cliente
  calificacion TINYINT NOT NULL,
  -- 1 a 5 estrellas, por ejemplo
  descripcion TEXT NOT NULL,
  -- comentario del cliente (texto largo)
  foto_url VARCHAR(255),
  -- url de la foto (/img/xxxx.png)
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabla para diseños guardados
CREATE TABLE IF NOT EXISTS disenos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  articulo_id INT NOT NULL,
  imagen VARCHAR(255) NOT NULL,
  elementos JSON,
  variantes JSON,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (articulo_id) REFERENCES products(id) ON DELETE CASCADE
);
-- Reiniciar diseños de ejemplo y dejar el diseño solicitado
-- Limpiar tabla de diseños
DELETE FROM disenos;

-- Variables de usuario y artículo
SET @usuario_id = (
  SELECT id FROM usuarios
  WHERE LOWER(nombre) = 'cliente' OR email = 'cliente@gmail.com'
  ORDER BY id LIMIT 1
);

SET @articulo_id = (
  SELECT id FROM products WHERE name = 'Polera Básica' LIMIT 1
);

-- Insertar el diseño "Polera6YIAAAAAAA"
INSERT INTO disenos (
  usuario_id,
  nombre,
  articulo_id,
  imagen,
  elementos,
  variantes,
  fecha_creacion
) VALUES
(
  @usuario_id,
  'Polera6YIAAAAAAA',
  @articulo_id,
  '/img/Polera6YIAAAAAAA.png',
  JSON_ARRAY(
    JSON_OBJECT(
      'id', 1,
      'type', 'text',
      'x', 40,
      'y', 40,
      'text', 'YIAAAAAAAA',
      'fontSize', 28,
      'fontFamily', 'Arial',
      'fill', '#8B0000'
    )
  ),
  JSON_OBJECT(
    'vista', 'frente',
    'cantidad', 1,
    'precio', 15000
  ),
  '2025-10-05 00:00:00'
),
(
  @usuario_id,
  'Polera8TCS3200',
  @articulo_id,
  '/img/Polera8TCS3200.png',
  JSON_ARRAY(
    JSON_OBJECT(
      'id', 1,
      'type', 'text',
      'x', 40,
      'y', 200,
      'text', 'TCS3200',
      'fontSize', 26,
      'fontFamily', 'Arial',
      'fill', '#FFFFFF'
    )
  ),
  JSON_OBJECT(
    'vista', 'frente',
    'cantidad', 2,
    'precio', 15000
  ),
  '2025-10-05 00:00:00'
);
