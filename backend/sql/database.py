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

CREATE TABLE IF NOT EXISTS articulos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,        -- precio base
  descripcion TEXT,
  foto VARCHAR(500),                    -- URL de imagen principal
  descuento DECIMAL(5,2) DEFAULT 0,     -- % de descuento
  ranking DECIMAL(3,2) DEFAULT 0        -- promedio de evaluaciones
);

CREATE TABLE IF NOT EXISTS variantes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  articulo_id BIGINT NOT NULL,
  nombre_categoria VARCHAR(100) NOT NULL, -- ej: "Talla", "Color"
  valor VARCHAR(100) NOT NULL,            -- ej: "M", "Rojo"
  imagen VARCHAR(500),                    -- opcional: para mostrar miniatura
  FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS objeto (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  articulo_id BIGINT NOT NULL,
  existencias INT DEFAULT 0,
  precio DECIMAL(10,2),                   -- precio específico (puede diferir del base)
  FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS objeto_variante (
  objeto_id BIGINT NOT NULL,
  variante_id BIGINT NOT NULL,
  PRIMARY KEY (objeto_id, variante_id),
  FOREIGN KEY (objeto_id) REFERENCES objeto(id) ON DELETE CASCADE,
  FOREIGN KEY (variante_id) REFERENCES variantes(id) ON DELETE CASCADE
);
/* Procedimiento para mostrar roles y permisos.
   Eliminamos las directivas DELIMITER porque se ejecutará
   desde un cliente (mysql-connector) que acepta multi-statement.
*/
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
END;
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

# SQL para datos de ejemplo de productos
sql_datos_productos = """
-- Insertar artículos de ejemplo
INSERT INTO articulos (nombre, precio, descripcion, foto, descuento, ranking) VALUES
('Camiseta Básica', 25.99, 'Camiseta de algodón 100% con corte clásico', 'https://example.com/camiseta.jpg', 0, 4.5),
('Pantalón Jeans', 79.99, 'Pantalón jeans de corte recto en denim premium', 'https://example.com/jeans.jpg', 10, 4.2),
('Zapatillas Deportivas', 129.99, 'Zapatillas para running con tecnología de amortiguación', 'https://example.com/zapatillas.jpg', 15, 4.8),
('Chaqueta de Cuero', 199.99, 'Chaqueta de cuero genuino con forro interior', 'https://example.com/chaqueta.jpg', 5, 4.6);

-- Insertar variantes para Camiseta Básica (ID 1)
INSERT INTO variantes (articulo_id, nombre_categoria, valor, imagen) VALUES
-- Tallas
(1, 'Talla', 'XS', NULL),
(1, 'Talla', 'S', NULL),
(1, 'Talla', 'M', NULL),
(1, 'Talla', 'L', NULL),
(1, 'Talla', 'XL', NULL),
-- Colores
(1, 'Color', 'Blanco', 'https://example.com/camiseta-blanco.jpg'),
(1, 'Color', 'Negro', 'https://example.com/camiseta-negro.jpg'),
(1, 'Color', 'Gris', 'https://example.com/camiseta-gris.jpg'),
(1, 'Color', 'Azul Marino', 'https://example.com/camiseta-azul.jpg');

-- Insertar variantes para Pantalón Jeans (ID 2)
INSERT INTO variantes (articulo_id, nombre_categoria, valor, imagen) VALUES
-- Tallas
(2, 'Talla', '28', NULL),
(2, 'Talla', '30', NULL),
(2, 'Talla', '32', NULL),
(2, 'Talla', '34', NULL),
(2, 'Talla', '36', NULL),
-- Colores
(2, 'Color', 'Azul Clásico', 'https://example.com/jeans-azul.jpg'),
(2, 'Color', 'Negro', 'https://example.com/jeans-negro.jpg'),
(2, 'Color', 'Gris Oscuro', 'https://example.com/jeans-gris.jpg');

-- Insertar variantes para Zapatillas Deportivas (ID 3)
INSERT INTO variantes (articulo_id, nombre_categoria, valor, imagen) VALUES
-- Tallas
(3, 'Talla', '38', NULL),
(3, 'Talla', '39', NULL),
(3, 'Talla', '40', NULL),
(3, 'Talla', '41', NULL),
(3, 'Talla', '42', NULL),
(3, 'Talla', '43', NULL),
-- Colores
(3, 'Color', 'Blanco/Negro', 'https://example.com/zapatillas-blanco-negro.jpg'),
(3, 'Color', 'Negro/Rojo', 'https://example.com/zapatillas-negro-rojo.jpg'),
(3, 'Color', 'Azul/Blanco', 'https://example.com/zapatillas-azul-blanco.jpg');

-- Insertar variantes para Chaqueta de Cuero (ID 4)
INSERT INTO variantes (articulo_id, nombre_categoria, valor, imagen) VALUES
-- Tallas
(4, 'Talla', 'S', NULL),
(4, 'Talla', 'M', NULL),
(4, 'Talla', 'L', NULL),
(4, 'Talla', 'XL', NULL),
-- Colores
(4, 'Color', 'Negro', 'https://example.com/chaqueta-negro.jpg'),
(4, 'Color', 'Marrón', 'https://example.com/chaqueta-marron.jpg');
"""

def ejecutar_sql_multi(cursor, sql_script):
  # Ejecuta un script SQL que puede contener múltiples sentencias y procedimientos.
  # Usamos cursor.execute(..., multi=True) para que mysql-connector maneje correctamente
  # bloques como CREATE PROCEDURE que contienen ';' internos.
  try:
    for result in cursor.execute(sql_script, multi=True):
      # Algunos resultados pueden ser objetos con .statement o .rowcount
      try:
        _ = result.fetchall()
      except Exception:
        # No todas las sentencias retornan filas; ignorar
        pass
  except Exception as e:
    # Imprimir el SQL truncado en caso de error para diagnóstico
    preview = sql_script.strip().split('\n')[0:5]
    preview_text = '\n'.join(preview)
    print(f"Error ejecutando script (vista previa):\n{preview_text}\n{e}")

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

        print("Insertando datos de ejemplo de productos...")
        ejecutar_sql_multi(cursor, sql_datos_productos)

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