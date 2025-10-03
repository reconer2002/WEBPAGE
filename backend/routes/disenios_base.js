// backend/routes/diseniosBase.js
const express = require('express');
const router = express.Router();
const dbSelector = require('../middleware/dbSelector');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken, dbSelector);

router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM disenios_base ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener diseños base' });
  }
});

module.exports = router;