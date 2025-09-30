-- Tablas de productos (artículos, variantes, objetos, objeto_variante)

CREATE TABLE IF NOT EXISTS articulos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  foto VARCHAR(500),
  descuento DECIMAL(5,2) DEFAULT 0,
  ranking DECIMAL(3,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS variantes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  articulo_id BIGINT NOT NULL,
  nombre_categoria VARCHAR(100) NOT NULL,
  valor VARCHAR(100) NOT NULL,
  imagen VARCHAR(500),
  FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS objeto (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  articulo_id BIGINT NOT NULL,
  existencias INT DEFAULT 0,
  precio DECIMAL(10,2),
  FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS objeto_variante (
  objeto_id BIGINT NOT NULL,
  variante_id BIGINT NOT NULL,
  PRIMARY KEY (objeto_id, variante_id),
  FOREIGN KEY (objeto_id) REFERENCES objeto(id) ON DELETE CASCADE,
  FOREIGN KEY (variante_id) REFERENCES variantes(id) ON DELETE CASCADE
);
