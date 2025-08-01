-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS mentescreativasstore;
USE mentescreativasstore;

-- MANEJO DE USUARIOS 0.1

-- Tabla de usuarios
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de roles de usuario (Cliente, SuperAdmin, Admin)
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) -- ejemplo: 'cliente', 'superadmin', 'admin'
);

-- Tabla de permisos por rol (SuperAdmin puede manejar el rol de Admin, Admin puede moderar la página, cliente puede comprar)
CREATE TABLE permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) -- ejemplo: 'enviar_mails', 'gestionar_productos', 'editar_usuarios'
);

-- Tabla que indica qué roles tienen qué permisos
CREATE TABLE rol_permisos (
  rol_id INT,
  permiso_id INT,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

-- Tabla que indica qué usuarios tienen qué roles
CREATE TABLE usuario_roles (
  usuario_id INT,
  rol_id INT,
  PRIMARY KEY (usuario_id, rol_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Procedimiento para ver los permisos de cada rol
DELIMITER $$
CREATE PROCEDURE mostrar_roles_permisos()
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