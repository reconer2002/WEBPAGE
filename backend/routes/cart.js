const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Util: obtiene o crea carrito del usuario
async function getOrCreateCartId(userId) {
  const [[cart]] = await db.query('SELECT id FROM carts WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  if (cart) return cart.id;
  const [res] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return res.insertId;
}

// Aplica descuentos por línea
function computeLineTotals(item) {
  const base = item.price * item.quantity;
  let discount = 0;
  if (item.discount_percent) discount += base * (item.discount_percent / 100);
  if (item.bulk_min_qty && item.bulk_percent && item.quantity >= item.bulk_min_qty) {
    discount += base * (item.bulk_percent / 100);
  }
  discount = Math.floor(discount);
  const total = Math.max(0, base - discount);
  return { base, discount, total };
}

// GET /api/cart
router.get('/', auth, async (req, res) => {
  try {
    const cartId = await getOrCreateCartId(req.user.id);
    const [rows] = await db.query(
      `SELECT ci.product_id, ci.quantity,
              p.name, p.price, p.image,
              p.discount_percent, p.bulk_min_qty, p.bulk_percent,
              IFNULL(i.stock,0) AS stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_inventory i ON i.product_id = p.id
       WHERE ci.cart_id = ?
       ORDER BY p.name`,
      [cartId]
    );
    // Totales
    let base = 0, discount = 0, total = 0;
    const items = rows.map(r => {
      const t = computeLineTotals(r);
      base += t.base; discount += t.discount; total += t.total;
      return { ...r, line_base: t.base, line_discount: t.discount, line_total: t.total };
    });
    res.json({ cartId, items, totals: { base, discount, total } });
  } catch (err) {
    console.error('Error obteniendo carrito:', err);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
});

// POST /api/cart/items { productId, qty }
router.post('/items', auth, async (req, res) => {
  try {
    const { productId, qty } = req.body || {};
    const id = parseInt(productId, 10);
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'productId inválido' });

    const cartId = await getOrCreateCartId(req.user.id);
    await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [cartId, id, quantity]
    );
    res.json({ message: 'Agregado al carrito' });
  } catch (err) {
    console.error('Error agregando al carrito:', err);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
});

// PATCH /api/cart/items/:productId { qty }
router.patch('/items/:productId', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.productId, 10);
    const quantity = Math.max(1, parseInt(req.body?.qty, 10) || 1);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'productId inválido' });

    const cartId = await getOrCreateCartId(req.user.id);
    const [result] = await db.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
      [quantity, cartId, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item no existe en carrito' });
    res.json({ message: 'Cantidad actualizada' });
  } catch (err) {
    console.error('Error modificando cantidad:', err);
    res.status(500).json({ error: 'Error al modificar cantidad' });
  }
});

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.productId, 10);
    const cartId = await getOrCreateCartId(req.user.id);
    await db.query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, id]);
    res.json({ message: 'Diseño eliminado del carrito' });
  } catch (err) {
    console.error('Error eliminando item:', err);
    res.status(500).json({ error: 'Error al eliminar del carrito' });
  }
});

// POST /api/cart/check-availability  -> comprueba todo el carrito
router.post('/check-availability', auth, async (req, res) => {
  try {
    const cartId = await getOrCreateCartId(req.user.id);
    const [rows] = await db.query(
      `SELECT ci.product_id, ci.quantity, IFNULL(i.stock,0) AS stock
       FROM cart_items ci
       LEFT JOIN product_inventory i ON i.product_id = ci.product_id
       WHERE ci.cart_id = ?`,
      [cartId]
    );
    const problems = rows.filter(r => r.stock < r.quantity);
    res.json({ ok: problems.length === 0, problems });
  } catch (err) {
    console.error('Error comprobando disponibilidad:', err);
    res.status(500).json({ error: 'Error al comprobar disponibilidad' });
  }
});

// POST /api/cart/checkout -> descuenta stock y limpia carrito (transaccional)
router.post('/checkout', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const cartId = await getOrCreateCartId(req.user.id);
    await conn.beginTransaction();
    const [items] = await conn.query(
      `SELECT ci.product_id, ci.quantity, IFNULL(i.stock,0) AS stock
       FROM cart_items ci
       LEFT JOIN product_inventory i ON i.product_id = ci.product_id
       WHERE ci.cart_id = ? FOR UPDATE`,
      [cartId]
    );
    const problems = items.filter(r => r.stock < r.quantity);
    if (problems.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Stock insuficiente', problems });
    }
    for (const it of items) {
      await conn.query(
        'UPDATE product_inventory SET stock = stock - ? WHERE product_id = ?',
        [it.quantity, it.product_id]
      );
    }
    await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    await conn.commit();
    res.json({ message: 'Compra realizada. Existencias actualizadas.' });
  } catch (err) {
    await conn.rollback();
    console.error('Error en checkout:', err);
    res.status(500).json({ error: 'Error al finalizar compra' });
  } finally {
    conn.release();
  }
});

module.exports = router;

