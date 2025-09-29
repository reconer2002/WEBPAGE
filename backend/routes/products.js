const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const verifyPermiso = require('../middleware/permisos');

// GET /api/products?search=
router.get('/', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    let sql = `
      SELECT p.id, p.name, p.price, p.image,
             p.discount_percent, p.bulk_min_qty, p.bulk_percent,
             IFNULL(i.stock, 0) AS stock
      FROM products p
      LEFT JOIN product_inventory i ON i.product_id = p.id
    `;
    const params = [];
    if (search) {
      sql += ' WHERE p.name LIKE ?';
      params.push(`%${search}%`);
    }
    sql += ' ORDER BY p.name ASC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listando productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/products/:id/availability?qty=number
router.get('/:id/availability', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const qty = Math.max(1, parseInt(req.query.qty, 10) || 1);
    const [[row]] = await db.query(
      'SELECT IFNULL(i.stock, 0) AS stock FROM product_inventory i WHERE i.product_id = ?',
      [id]
    );
    const stock = row ? row.stock : 0;
    res.json({ available: stock >= qty, stock });
  } catch (err) {
    console.error('Error disponibilidad producto:', err);
    res.status(500).json({ error: 'Error al comprobar disponibilidad' });
  }
});

// POST /api/products/stock-batch  { updates: [{ productId, delta }] }
router.post('/stock-batch', auth, verifyPermiso('editar_productos'), async (req, res) => {
  const { updates } = req.body || {};
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'Debes enviar updates: [{ productId, delta }]' });
  }
  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const u of updates) {
        const pid = parseInt(u.productId, 10);
        const delta = parseInt(u.delta, 10);
        if (!Number.isInteger(pid) || !Number.isFinite(delta)) continue;
        await conn.query(
          'INSERT INTO product_inventory (product_id, stock) VALUES (?, GREATEST(0, ?)) ON DUPLICATE KEY UPDATE stock = GREATEST(0, stock + VALUES(stock))',
          [pid, delta]
        );
      }
      await conn.commit();
      res.json({ message: 'Inventario actualizado' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error actualizando inventario:', err);
    res.status(500).json({ error: 'Error al actualizar inventario' });
  }
});

module.exports = router;

