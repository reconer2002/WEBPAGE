const mysql = require('mysql2/promise');

// Pools separados para prod y test (opcional)
const poolProd = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME_PROD || process.env.DB_NAME,
});

// Creamos el pool de test pero NO lo usaremos a menos que se habilite explícitamente
const poolTest = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME_TEST || process.env.DB_NAME_PROD || process.env.DB_NAME,
});

// Devuelve el pool según entorno, con fallback seguro a prod si test no está habilitado
const getDb = (entorno = 'prod') => {
  const enableTest = String(process.env.ENABLE_TEST_DB || 'false').toLowerCase() === 'true';
  if (entorno === 'test' && enableTest) return poolTest;
  return poolProd;
};

// Compatibilidad: exportar el pool prod como default y anexar getDb
const defaultPool = poolProd;
defaultPool.getDb = getDb;
module.exports = defaultPool;
