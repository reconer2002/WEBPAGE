import mysql.connector
from mysql.connector import Error

# Credenciales para MySQL
MYSQL_HOST = "localhost"
MYSQL_USER = "root"  # Usuario root
MYSQL_PASSWORD = "1234"  # Contraseña 1234

# SQL de creación de la base de datos y tablas
sql_creacion = """
CREATE DATABASE IF NOT EXISTS mentescreativasstore;
USE mentescreativasstore;

-- MANEJO DE USUARIOS 0.1

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  rol_id INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) -- ejemplo: 'cliente', 'superadmin', 'admin'
);

CREATE TABLE IF NOT EXISTS permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) -- ejemplo: 'enviar_mails', 'gestionar_productos', 'editar_usuarios'
);

CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id INT,
  permiso_id INT,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

CREATE TABLE IF NOT EXISTS categorias_mantenedor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  permiso_id INT, -- permiso necesario para ver esta categoría
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

CREATE TABLE IF NOT EXISTS subcategorias_mantenedor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT,
  nombre VARCHAR(100),
  permiso_id INT, -- permiso necesario para ver esta subcategoría
  FOREIGN KEY (categoria_id) REFERENCES categorias_mantenedor(id),
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

-- Tabla de configuración de la página
CREATE TABLE IF NOT EXISTS configuracion_pagina (
    id INT PRIMARY KEY AUTO_INCREMENT,
    logo_url VARCHAR(255),       -- ruta o url del logo en png
    telefono1 VARCHAR(20),
    telefono2 VARCHAR(20),
    color1 VARCHAR(20),          -- hex ej: #FF0000
    color2 VARCHAR(20),
    color3 VARCHAR(20),
    direccion VARCHAR(255),
    correo_contacto VARCHAR(100),
    instagram_url VARCHAR(255),
    estado TINYINT(1) DEFAULT 1, -- 1 = activa, 0 = en mantenimiento
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
                      ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de testimonios de clientes
CREATE TABLE IF NOT EXISTS testimonios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(25) NOT NULL,          -- nombre del cliente
    calificacion TINYINT NOT NULL,        -- 1 a 5 estrellas, por ejemplo
    descripcion TEXT NOT NULL,            -- comentario del cliente (texto largo)
    foto_url VARCHAR(255),                -- url de la foto (/img/xxxx.png)
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
                  ON UPDATE CURRENT_TIMESTAMP
);

-- Procedimiento para ver los permisos de cada rol
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS mostrar_roles_permisos()
BEGIN
  DECLARE sql_query TEXT;

  SELECT GROUP_CONCAT(
    DISTINCT CONCAT(
      'MAX(CASE WHEN p.nombre = ''',
      p.nombre,
      ''' THEN ''Sí'' ELSE ''No'' END) AS `',
      p.nombre, '`'
    ) ORDER BY p.id
  ) INTO sql_query
  FROM permisos p;

  SET @final_sql = CONCAT(
    'SELECT r.nombre AS rol, ', sql_query, 
    ' FROM roles r
      LEFT JOIN rol_permisos rp ON r.id = rp.rol_id
      LEFT JOIN permisos p ON rp.permiso_id = p.id
      GROUP BY r.id, r.nombre
      ORDER BY r.nombre;'
  );

  PREPARE stmt FROM @final_sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END $$

DELIMITER ;
"""

# SQL para insertar registros iniciales
sql_inserts = """
-- Roles básicos
INSERT INTO roles (nombre) VALUES
('cliente'),
('superadmin'),
('admin'),
('admin_productos'),
('baneado');

-- Permisos básicos
INSERT INTO permisos (nombre) VALUES
('ver_productos'),
('comprar_productos'),
('personalizar_productos'),
('dejar_comentarios'),
('ver_mantenedor'),
('ver_usuarios'),
('gestionar_roles'),
('moderar_usuarios'),
('ver_pagina'),
('configurar_pagina'),
('desconectar_pagina'),
('cambiar_colores'),
('editar_testimonios'),
('editar_productos'),
('agregar_productos'),
('eliminar_productos'),
('gestionar_descuentos');

-- Permisos cliente
INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
(1, 1), -- ver_productos
(1, 2), -- comprar_productos
(1, 3), -- personalizar_productos
(1, 4); -- dejar_comentarios

-- Permisos superadmin (todos menos los de cliente)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos
WHERE id NOT IN (1, 2, 3, 4);

-- Permisos admin
INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
(3, 5); -- ver_mantenedor

-- Permisos admin de productos
INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
(4, 8), -- editar_productos
(4, 9), -- agregar_productos
(4, 10), -- eliminar_productos
(4, 11); -- gestionar_descuentos

-- Usuarios básicos
INSERT INTO usuarios (nombre, email, password, rol_id) VALUES
('superadmin', 'superadmin@gmail.com', '$2a$10$ElttXEchpfV8xoMSjkCDoeO1ARp2MLWC2V6/qtnuXegZV2nQgoDX6',2),
('admin', 'admin@gmail.com', '$2a$10$ElttXEchpfV8xoMSjkCDoeO1ARp2MLWC2V6/qtnuXegZV2nQgoDX6',3),
('cliente', 'cliente@gmail.com', '$2a$10$ElttXEchpfV8xoMSjkCDoeO1ARp2MLWC2V6/qtnuXegZV2nQgoDX6',1);

-- Categorías básicas
INSERT INTO categorias_mantenedor (nombre, permiso_id) VALUES
('USUARIOS',6),
('PAGINA',9),
('TESTIMONIOS',13),
('PRODUCTOS',14);

-- Subcategorías básicas
INSERT INTO subcategorias_mantenedor (categoria_id, nombre, permiso_id) VALUES
(1,'cuentas',8),
(1,'roles',7),
(2,'configuracion',10),
(2,'conexion',11),
(2,'colores',12),
(3,'testimonios',13),
(4,'articulos',15);

-- Configuración de página básica
INSERT INTO configuracion_pagina 
  (logo_url, telefono1, telefono2, color1, color2, color3, estado, instagram_url, correo_contacto, direccion)
VALUES
  ('/img/Logo.png', '+56988776655', '+56911223344', '#006A71', '#9ACBD0', '#F2EFE7', 1, 
   'https://www.instagram.com/mentes___creativas_/', 
   'contacto@mentescreativas.cl', 
   'Av. Creatividad 123, Santiago, Chile');

-- Testimonios
INSERT INTO testimonios (nombre, calificacion, descripcion, foto_url)
VALUES
('Vieja Seca - Banda', 5, 'Estamparon las poleras y polerones para nuestra banda en solo un par de días. La calidad y rapidez fueron increíbles, ¡totalmente recomendados!', '/img/testimonio1.png');
"""

def ejecutar_sql_multi(cursor, sql_script):
    # Divide el script por ';' y ejecuta cada sentencia
    statements = [s.strip() for s in sql_script.split(';') if s.strip()]
    for stmt in statements:
        try:
            cursor.execute(stmt)
        except Exception as e:
            print(f"Error ejecutando sentencia: {stmt}\n{e}")

def main():
    try:
        # Conexión inicial (sin base de datos seleccionada)
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD
        )
        cursor = conn.cursor()

        print("Creando base de datos y tablas...")
        ejecutar_sql_multi(cursor, sql_creacion)

        print("Insertando registros iniciales...")
        ejecutar_sql_multi(cursor, sql_inserts)

        conn.commit()
        print("✅ Base de datos generada con éxito.")

    except Error as e:
        print(f"Error: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
            print("Conexión cerrada.")

if __name__ == "__main__":
    main()
