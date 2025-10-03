const { getDb } = require('../db');

module.exports = function dbSelector(req, res, next) {
  const entorno = req.headers['x-entorno'] || 'prod';
  req.db = getDb(entorno);
  next();
};