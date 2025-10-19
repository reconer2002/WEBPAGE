const pool = require('../db');

const COLUMN_DEFINITIONS = {
  apellido: "ALTER TABLE usuarios ADD COLUMN apellido VARCHAR(100) AFTER nombre",
  telefono: "ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(30) AFTER email",
  direccion: "ALTER TABLE usuarios ADD COLUMN direccion VARCHAR(255) AFTER telefono",
  ciudad: "ALTER TABLE usuarios ADD COLUMN ciudad VARCHAR(100) AFTER direccion",
  region: "ALTER TABLE usuarios ADD COLUMN region VARCHAR(100) AFTER ciudad",
  verificado: "ALTER TABLE usuarios ADD COLUMN verificado TINYINT(1) DEFAULT 0 AFTER rol_id",
  verificacion_token:
    "ALTER TABLE usuarios ADD COLUMN verificacion_token VARCHAR(64) AFTER verificado",
  verificacion_expira:
    "ALTER TABLE usuarios ADD COLUMN verificacion_expira DATETIME AFTER verificacion_token",
  actualizado_en:
    "ALTER TABLE usuarios ADD COLUMN actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER creado_en",
};

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

const ensureUserProfileSchema = async () => {
  const connection = pool;
  try {
    for (const [column, statement] of Object.entries(COLUMN_DEFINITIONS)) {
      await ensureColumn(connection, 'usuarios', column, statement);
    }
  } catch (error) {
    console.error('Error ensuring usuarios schema:', error);
    throw error;
  }
};

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
  ensureCartSchema,
};
