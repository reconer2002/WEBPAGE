-- Crear tabla para diseños guardados
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