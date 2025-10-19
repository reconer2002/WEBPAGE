const express = require('express');
const router = express.Router();
const db = require('../db');

const DEMO_STOCK = Number.isFinite(parseInt(process.env.DEMO_STOCK, 10))
  ? parseInt(process.env.DEMO_STOCK, 10)
  : null;

// GET /api/products - lista de productos para el carrito
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.name, p.price, p.image, p.discount_percent, p.bulk_min_qty, p.bulk_percent,
              IFNULL(i.stock, 0) AS stock
       FROM products p
       LEFT JOIN product_inventory i ON i.product_id = p.id
       ORDER BY p.name`
    );
    if (DEMO_STOCK !== null) rows.forEach((r) => (r.stock = DEMO_STOCK));
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[row]] = await db.query(
      `SELECT p.id, p.name, p.price, p.image, p.discount_percent, p.bulk_min_qty, p.bulk_percent,
              IFNULL(i.stock, 0) AS stock
       FROM products p
       LEFT JOIN product_inventory i ON i.product_id = p.id
       WHERE p.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
    if (DEMO_STOCK !== null) row.stock = DEMO_STOCK;
    res.json(row);
  } catch (err) {
    console.error('Error obteniendo producto:', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

module.exports = router;
