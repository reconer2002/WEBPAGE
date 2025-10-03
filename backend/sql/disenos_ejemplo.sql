-- Insertar diseños de ejemplo
USE mentescreativasstore;
-- Obtener el ID del usuario Cliente
SET @usuario_id = (
        SELECT id
        FROM usuarios
        WHERE nombre = 'Cliente'
        LIMIT 1
    );
-- Insertar algunos diseños de ejemplo
INSERT INTO disenos (
        usuario_id,
        nombre,
        articulo_id,
        imagen,
        elementos,
        variantes,
        fecha_creacion
    )
VALUES (
        @usuario_id,
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
    ),
    (
        @usuario_id,
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
    ),
    (
        @usuario_id,
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
    );