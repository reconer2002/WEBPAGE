const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token no enviado' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no válido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // añade usuario a req
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};