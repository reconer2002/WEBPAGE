-- MANEJO DE USUARIOS 0.1

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
('TESTIMONIOS',13);

-- Subcategorías básicas
INSERT INTO subcategorias_mantenedor (categoria_id, nombre, permiso_id) VALUES
(1,'cuentas',8),
(1,'roles',7),
(2,'configuracion',10),
(2,'conexion',11),
(2,'colores',12),
(3,'testimonios',13);

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