-- Reiniciar diseños de ejemplo y agregar uno específico para el cliente
USE mentescreativasstore;

-- Limpiar diseños anteriores
DELETE FROM disenos;

-- Variables auxiliares
SET @usuario_id = (
  SELECT id FROM usuarios
  WHERE LOWER(nombre) = 'cliente' OR email = 'cliente@gmail.com'
  ORDER BY id LIMIT 1
);

SET @articulo_id = (
  SELECT id FROM products WHERE name = 'Polera Básica' LIMIT 1
);

-- Insertar el diseño solicitado
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
