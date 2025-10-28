const pool = require('../db');

// Utilidad: verificar existencia de columna
const ensureColumn = async (connection, table, column, statement) => {
  const [[{ cnt }]] = await connection.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?`,
    [table, column]
  );

  if (!cnt) {
    await connection.query(statement);
  }
};

// Asegurar que exista la tabla personas y columnas de perfil en ella
const ensureUserProfileSchema = async () => {
  const connection = pool;
  try {
    // 1) Crear tabla personas si no existe (normalizada)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS personas (
        id INT NOT NULL AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        nombre_real VARCHAR(100) NULL,
        apellido VARCHAR(100) NULL,
        fecha_nacimiento DATE NULL,
        direccion VARCHAR(255) NULL,
        telefono VARCHAR(30) NULL,
        ciudad VARCHAR(100) NULL,
        region VARCHAR(100) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_usuario_persona (usuario_id),
        CONSTRAINT fk_persona_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // 2) Asegurar columnas en personas (idempotente)
    await ensureColumn(connection, 'personas', 'telefono', "ALTER TABLE personas ADD COLUMN telefono VARCHAR(30) NULL AFTER direccion");
    await ensureColumn(connection, 'personas', 'ciudad', "ALTER TABLE personas ADD COLUMN ciudad VARCHAR(100) NULL AFTER telefono");
    await ensureColumn(connection, 'personas', 'region', "ALTER TABLE personas ADD COLUMN region VARCHAR(100) NULL AFTER ciudad");
    await ensureColumn(connection, 'personas', 'fecha_nacimiento', "ALTER TABLE personas ADD COLUMN fecha_nacimiento DATE NULL AFTER apellido");

    // 3) Relajar NOT NULL de campos clave para permitir creación paulatina
    try { await connection.query('ALTER TABLE personas MODIFY nombre_real VARCHAR(100) NULL'); } catch (_) {}
    try { await connection.query('ALTER TABLE personas MODIFY fecha_nacimiento DATE NULL'); } catch (_) {}
    try { await connection.query('ALTER TABLE personas MODIFY apellido VARCHAR(100) NULL'); } catch (_) {}
    try { await connection.query('ALTER TABLE personas MODIFY direccion VARCHAR(255) NULL'); } catch (_) {}

    // 4) Migración suave: copiar datos existentes desde usuarios -> personas si faltan
    // Solo si usuarios aún tiene esas columnas
    const [cols] = await connection.query(
      `SELECT GROUP_CONCAT(column_name) AS cols
       FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'usuarios'`
    );
    const colset = (cols[0]?.cols || '').split(',').map(c => c.trim());
    const has = (c) => colset.includes(c);
    if (has('apellido') || has('telefono') || has('direccion') || has('ciudad') || has('region')) {
      // Insertar filas faltantes en personas
      await connection.query(`
        INSERT INTO personas (usuario_id, apellido, direccion, telefono, ciudad, region)
        SELECT u.id, u.apellido, u.direccion, u.telefono, u.ciudad, u.region
        FROM usuarios u
        LEFT JOIN personas p ON p.usuario_id = u.id
        WHERE p.usuario_id IS NULL
      `);

      // Completar campos nulos en personas desde usuarios
      await connection.query(`
        UPDATE personas p
        JOIN usuarios u ON u.id = p.usuario_id
        SET p.apellido = COALESCE(p.apellido, u.apellido),
            p.direccion = COALESCE(p.direccion, u.direccion),
            p.telefono = COALESCE(p.telefono, u.telefono),
            p.ciudad = COALESCE(p.ciudad, u.ciudad),
            p.region = COALESCE(p.region, u.region)
      `);
    }
  } catch (error) {
    console.error('Error ensuring personas schema:', error);
    throw error;
  }
};

// Asegurar tablas de comercio: pedidos, envios, disenos_pedido, envio_eventos
const ensureCommerceSchema = async () => {
  const connection = pool;
  try {
    // pedidos (si no existe)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id BIGINT NOT NULL AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        carrito_id BIGINT NULL,
        costo DECIMAL(10,2) NOT NULL DEFAULT 0,
        fecha DATETIME NOT NULL,
        estado VARCHAR(20) NOT NULL,
        PRIMARY KEY (id),
        KEY idx_usuario (usuario_id),
        KEY idx_carrito (carrito_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // envios (si no existe)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS envios (
        id BIGINT NOT NULL AUTO_INCREMENT,
        pedido_id BIGINT NOT NULL,
        metodo VARCHAR(30) NULL,
        receptor_nombre VARCHAR(100) NULL,
        receptor_telefono VARCHAR(50) NULL,
        direccion VARCHAR(255) NULL,
        comuna VARCHAR(100) NULL,
        ciudad VARCHAR(100) NULL,
        region VARCHAR(100) NULL,
        instrucciones VARCHAR(255) NULL,
        costo_envio DECIMAL(10,2) DEFAULT 0,
        carrier VARCHAR(50) NULL,
        tracking VARCHAR(100) NULL,
        tracking_url VARCHAR(255) NULL,
        estado_envio VARCHAR(30) DEFAULT 'pendiente',
        creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_pedido (pedido_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // disenos_pedido (para snapshot de items del pedido)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS disenos_pedido (
        id BIGINT NOT NULL AUTO_INCREMENT,
        pedido_id BIGINT NOT NULL,
        usuario_id INT NOT NULL,
        objeto_id BIGINT NOT NULL,
        nombre_diseno VARCHAR(150) NOT NULL,
        datos JSON NOT NULL,
        costo DECIMAL(10,2) NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        KEY idx_pedido (pedido_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // Historial de envíos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS envio_eventos (
        id BIGINT NOT NULL AUTO_INCREMENT,
        envio_id BIGINT NOT NULL,
        estado VARCHAR(50) NOT NULL,
        detalle VARCHAR(255) NULL,
        creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY envio_idx (envio_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // Compatibilidad: asegurar columnas clave si faltan
    await ensureColumn(connection, 'carrito_disenos', 'cantidad', "ALTER TABLE carrito_disenos ADD COLUMN cantidad INT NOT NULL DEFAULT 1 AFTER diseno_id");
    await ensureColumn(connection, 'envios', 'tracking_url', "ALTER TABLE envios ADD COLUMN tracking_url VARCHAR(255) NULL AFTER tracking");
  } catch (error) {
    console.error('Error ensuring commerce schema:', error);
    throw error;
  }
};

// Export agrupado al final del archivo

// Cart schema: add optional columns to cart_items so we can persist design image/id
const ensureCartSchema = async () => {
  const connection = pool;
  try {
    await ensureColumn(
      connection,
      'cart_items',
      'custom_image',
      "ALTER TABLE cart_items ADD COLUMN custom_image VARCHAR(255) NULL AFTER quantity"
    );
    await ensureColumn(
      connection,
      'cart_items',
      'design_id',
      "ALTER TABLE cart_items ADD COLUMN design_id INT NULL AFTER custom_image"
    );
    // Ensure design_id is NOT NULL with default 0 for composite key behavior
    try {
      await connection.query('UPDATE cart_items SET design_id = 0 WHERE design_id IS NULL');
      await connection.query('ALTER TABLE cart_items MODIFY COLUMN design_id INT NOT NULL DEFAULT 0');
    } catch (e) {
      // ignore if fails (e.g., column already NOT NULL)
    }
    // Ensure composite primary key (cart_id, product_id, design_id)
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME, SEQ_IN_INDEX
       FROM information_schema.statistics
       WHERE table_schema = DATABASE()
         AND table_name = 'cart_items'
         AND index_name = 'PRIMARY'
       ORDER BY SEQ_IN_INDEX`
    );
    const cols = rows.map((r) => r.COLUMN_NAME).join(',');
    if (cols !== 'cart_id,product_id,design_id') {
      try {
        // Try single ALTER to keep FKs satisfied
        await connection.query(
          'ALTER TABLE cart_items DROP PRIMARY KEY, ADD PRIMARY KEY (cart_id, product_id, design_id)'
        );
      } catch (e1) {
        // Fallback: add supporting indexes then retry in one shot
        try {
          await connection.query('CREATE INDEX IF NOT EXISTS idx_ci_cart ON cart_items(cart_id)');
        } catch (_) {}
        try {
          await connection.query('CREATE INDEX IF NOT EXISTS idx_ci_product ON cart_items(product_id)');
        } catch (_) {}
        try {
          await connection.query(
            'ALTER TABLE cart_items DROP PRIMARY KEY, ADD PRIMARY KEY (cart_id, product_id, design_id)'
          );
        } catch (e2) {
          console.warn('No se pudo asegurar PK compuesta en cart_items:', e2.message);
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring cart schema:', error);
  }
};

module.exports = {
  ensureUserProfileSchema,
  ensureCommerceSchema,
  ensureCartSchema,
};