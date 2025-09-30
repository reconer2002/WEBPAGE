-- Datos de ejemplo para las tablas de productos

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

-- Crear algunos objetos de ejemplo manualmente

-- Camiseta Blanca Talla M
INSERT INTO objeto (articulo_id, existencias, precio) VALUES (1, 50, 25.99);
SET @objeto_id = LAST_INSERT_ID();
INSERT INTO objeto_variante (objeto_id, variante_id) VALUES 
(@objeto_id, 3), -- Talla M
(@objeto_id, 6); -- Color Blanco

-- Camiseta Negra Talla L
INSERT INTO objeto (articulo_id, existencias, precio) VALUES (1, 30, 25.99);
SET @objeto_id = LAST_INSERT_ID();
INSERT INTO objeto_variante (objeto_id, variante_id) VALUES 
(@objeto_id, 4), -- Talla L
(@objeto_id, 7); -- Color Negro

-- Jeans Azul Clásico Talla 32
INSERT INTO objeto (articulo_id, existencias, precio) VALUES (2, 25, 79.99);
SET @objeto_id = LAST_INSERT_ID();
INSERT INTO objeto_variante (objeto_id, variante_id) VALUES 
(@objeto_id, 12), -- Talla 32
(@objeto_id, 15); -- Color Azul Clásico

-- Zapatillas Blanco/Negro Talla 41
INSERT INTO objeto (articulo_id, existencias, precio) VALUES (3, 15, 129.99);
SET @objeto_id = LAST_INSERT_ID();
INSERT INTO objeto_variante (objeto_id, variante_id) VALUES 
(@objeto_id, 21), -- Talla 41
(@objeto_id, 24); -- Color Blanco/Negro

-- Chaqueta Negra Talla L
INSERT INTO objeto (articulo_id, existencias, precio) VALUES (4, 8, 189.99);
SET @objeto_id = LAST_INSERT_ID();
INSERT INTO objeto_variante (objeto_id, variante_id) VALUES 
(@objeto_id, 29), -- Talla L
(@objeto_id, 30); -- Color Negro