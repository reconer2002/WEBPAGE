import mysql.connector
from mysql.connector import Error

# Credenciales para MySQL
MYSQL_HOST = "localhost"
MYSQL_USER = "tu_usuario"
MYSQL_PASSWORD = "tu_contraseña"

# SQL de creación de la base de datos y tablas
sql_creacion = """
CREATE DATABASE IF NOT EXISTS mentescreativasstore;
USE mentescreativasstore;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  rol_id INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
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
  permiso_id INT,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

CREATE TABLE IF NOT EXISTS subcategorias_mantenedor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT,
  nombre VARCHAR(100),
  permiso_id INT,
  FOREIGN KEY (categoria_id) REFERENCES categorias_mantenedor(id),
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

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
INSERT INTO roles (nombre) VALUES
('cliente'),
('superadmin'),
('admin'),
('admin_productos'),
('baneado');

INSERT INTO permisos (nombre) VALUES
('ver_productos'),
('comprar_productos'),
('personalizar_productos'),
('dejar_comentarios'),
('ver_mantenedor'),
('ver_usuarios'),
('gestionar_roles'),
('moderar_usuarios'),
('editar_productos'),
('agregar_productos'),
('eliminar_productos'),
('gestionar_descuentos');

INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4);

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos
WHERE id NOT IN (1, 2, 3, 4);

INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
(3, 5);

INSERT INTO rol_permisos (rol_id, permiso_id) VALUES
(4, 8),
(4, 9),
(4, 10),
(4, 11);

INSERT INTO usuarios (nombre, email, password, rol_id) VALUES
('superadmin', 'superadmin@gmail.com', '$2a$10$ElttXEchpfV8xoMSjkCDoeO1ARp2MLWC2V6/qtnuXegZV2nQgoDX6',2),
('admin', 'admin@gmail.com', '$2a$10$ElttXEchpfV8xoMSjkCDoeO1ARp2MLWC2V6/qtnuXegZV2nQgoDX6',3),
('cliente', 'cliente@gmail.com', '$2a$10$ElttXEchpfV8xoMSjkCDoeO1ARp2MLWC2V6/qtnuXegZV2nQgoDX6',1);

INSERT INTO categorias_mantenedor (nombre, permiso_id) VALUES
('USUARIOS',6);

INSERT INTO subcategorias_mantenedor (categoria_id, nombre, permiso_id) VALUES
(1,'cuentas',8),
(1,'roles',7);
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