const express = require('express');
const router = express.Router();
const db = require('../db');

const DEMO_STOCK = Number.isFinite(parseInt(process.env.DEMO_STOCK, 10))
  ? parseInt(process.env.DEMO_STOCK, 10)
  : null;

// Adaptación: exponer artículos como "products" para compatibilidad con el frontend
// name -> articulos.nombre, price -> articulos.precio, image -> articulos.foto
// stock -> SUM(objetos.existencias) por artículo, discount_percent -> articulos.descuento

// GET /api/products - lista de productos (desde articulos/objetos)
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         a.id,
         a.nombre AS name,
         a.precio AS price,
         a.foto AS image,
         a.descuento AS discount_percent,
         NULL AS bulk_min_qty,
         NULL AS bulk_percent,
         IFNULL(SUM(o.existencias), 0) AS stock
       FROM articulos a
       LEFT JOIN objetos o ON o.articulo_id = a.id
       GROUP BY a.id, a.nombre, a.precio, a.foto, a.descuento
       ORDER BY a.nombre`
    );
    if (DEMO_STOCK !== null) rows.forEach((r) => (r.stock = DEMO_STOCK));
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo productos (articulos):', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/products/:id (desde articulos/objetos)
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[row]] = await db.query(
      `SELECT 
         a.id,
         a.nombre AS name,
         a.precio AS price,
         a.foto AS image,
         a.descuento AS discount_percent,
         NULL AS bulk_min_qty,
         NULL AS bulk_percent,
         IFNULL(SUM(o.existencias), 0) AS stock
       FROM articulos a
       LEFT JOIN objetos o ON o.articulo_id = a.id
       WHERE a.id = ?
       GROUP BY a.id, a.nombre, a.precio, a.foto, a.descuento`,
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
    if (DEMO_STOCK !== null) row.stock = DEMO_STOCK;
    res.json(row);
  } catch (err) {
    console.error('Error obteniendo producto (articulo):', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

module.exports = router;
