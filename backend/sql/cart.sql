-- Tablas para carrito y productos (manteniendo las existentes intactas)

USE mentescreativasstore;

-- Productos
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  price INT NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  discount_percent INT DEFAULT 0,
  bulk_min_qty INT DEFAULT NULL,
  bulk_percent INT DEFAULT NULL
);

-- Inventario
CREATE TABLE IF NOT EXISTS product_inventory (
  product_id INT PRIMARY KEY,
  stock INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Carritos (asociados a usuarios)
CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Ítems del carrito
CREATE TABLE IF NOT EXISTS cart_items (
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (cart_id, product_id),
  CONSTRAINT fk_ci_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Semillas (coherentes con el frontend)
INSERT INTO products (name, price, image, discount_percent, bulk_min_qty, bulk_percent) VALUES
('Polera Básica', 10990, '/img/Logo.png', 0, NULL, NULL),
('Polerón Premium', 19990, '/img/Logo.png', 10, NULL, NULL),
('Gorro Bordado', 7990, '/img/Logo.png', 0, 3, 15),
('Tote Bag', 5990, '/img/Logo.png', 5, NULL, NULL);

INSERT INTO product_inventory (product_id, stock)
SELECT id, stock FROM (
  SELECT (SELECT id FROM products WHERE name='Polera Básica' LIMIT 1) AS id, 25 AS stock
  UNION ALL
  SELECT (SELECT id FROM products WHERE name='Polerón Premium' LIMIT 1), 12
  UNION ALL
  SELECT (SELECT id FROM products WHERE name='Gorro Bordado' LIMIT 1), 40
  UNION ALL
  SELECT (SELECT id FROM products WHERE name='Tote Bag' LIMIT 1), 30
) t
ON DUPLICATE KEY UPDATE stock = VALUES(stock);

