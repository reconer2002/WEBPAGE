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

const ensureColumn = async (connection, column, statement) => {
  const [[{ cnt }]] = await connection.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'usuarios'
       AND column_name = ?`,
    [column]
  );

  if (!cnt) {
    await connection.query(statement);
  }
};

const ensureUserProfileSchema = async () => {
  const connection = pool;
  try {
    for (const [column, statement] of Object.entries(COLUMN_DEFINITIONS)) {
      await ensureColumn(connection, column, statement);
    }
  } catch (error) {
    console.error('Error ensuring usuarios schema:', error);
    throw error;
  }
};

module.exports = {
  ensureUserProfileSchema,
};
