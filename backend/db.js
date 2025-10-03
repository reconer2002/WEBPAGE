const mysql = require('mysql2/promise');

const poolProd = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME_PROD,
});

const poolTest = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME_TEST,
});

// Función para obtener pool según entorno
const getDb = (entorno = 'prod') => {
  return entorno === 'test' ? poolTest : poolProd;
};

module.exports = { getDb };