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
-- Obtener el ID del usuario Cliente para los diseños de ejemplo
SET @usuario_id = (
    SELECT id
    FROM usuarios
    WHERE nombre = 'Cliente'
    LIMIT 1
  );
-- Insertar diseños de ejemplo
INSERT INTO disenos (
    usuario_id,
    nombre,
    articulo_id,
    imagen,
    elementos,
    variantes,
    fecha_creacion
  )
SELECT @usuario_id,
  'Polera Personalizada - Diseño Verano',
  (
    SELECT id
    FROM products
    WHERE name = 'Polera Básica'
    LIMIT 1
  ), '/img/Logo.png', JSON_ARRAY(
    JSON_OBJECT(
      'id', 1, 'type', 'text', 'x', 100, 'y', 150, 'text', 'Verano 2024', 'fontSize', 24, 'fontFamily', 'Arial', 'fill', '#FF6B6B'
    ), JSON_OBJECT(
      'id', 2, 'type', 'image', 'x', 150, 'y', 200, 'url', '/img/Logo.png', 'width', 100, 'height', 100
    )
  ), JSON_OBJECT(
    'color', JSON_OBJECT('id', 1, 'valor', 'Rojo'), 'talla', JSON_OBJECT('id', 2, 'valor', 'M')
  ), DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE NOT EXISTS (
    SELECT 1
    FROM disenos
    WHERE nombre = 'Polera Personalizada - Diseño Verano'
  );
INSERT INTO disenos (
    usuario_id,
    nombre,
    articulo_id,
    imagen,
    elementos,
    variantes,
    fecha_creacion
  )
SELECT @usuario_id,
  'Polerón Deportivo',
  (
    SELECT id
    FROM products
    WHERE name = 'Polerón Premium'
    LIMIT 1
  ), '/img/Logo.png', JSON_ARRAY(
    JSON_OBJECT(
      'id', 1, 'type', 'text', 'x', 120, 'y', 180, 'text', 'Sport Life', 'fontSize', 28, 'fontFamily', 'Impact', 'fill', '#4CAF50'
    )
  ), JSON_OBJECT(
    'color', JSON_OBJECT('id', 3, 'valor', 'Negro'), 'talla', JSON_OBJECT('id', 4, 'valor', 'L')
  ), DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE NOT EXISTS (
    SELECT 1
    FROM disenos
    WHERE nombre = 'Polerón Deportivo'
  );
INSERT INTO disenos (
    usuario_id,
    nombre,
    articulo_id,
    imagen,
    elementos,
    variantes,
    fecha_creacion
  )
SELECT @usuario_id,
  'Gorro Casual',
  (
    SELECT id
    FROM products
    WHERE name = 'Gorro Bordado'
    LIMIT 1
  ), '/img/Logo.png', JSON_ARRAY(
    JSON_OBJECT(
      'id', 1, 'type', 'text', 'x', 90, 'y', 130, 'text', 'Urban Style', 'fontSize', 20, 'fontFamily', 'Verdana', 'fill', '#3F51B5'
    ), JSON_OBJECT(
      'id', 2, 'type', 'image', 'x', 130, 'y', 160, 'url', '/img/Logo.png', 'width', 80, 'height', 80
    )
  ), JSON_OBJECT(
    'color', JSON_OBJECT('id', 5, 'valor', 'Azul'), 'talla', JSON_OBJECT('id', 6, 'valor', 'Única')
  ), NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM disenos
    WHERE nombre = 'Gorro Casual'
  );