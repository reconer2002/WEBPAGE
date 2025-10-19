const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Demo stock: si DEMO_STOCK está definido en .env, forzamos ese stock en todas las respuestas
const DEMO_STOCK = Number.isFinite(parseInt(process.env.DEMO_STOCK, 10))
  ? parseInt(process.env.DEMO_STOCK, 10)
  : null;

// Util: obtiene o crea carrito del usuario
async function getOrCreateCartId(userId) {
  const [[cart]] = await db.query('SELECT id FROM carts WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  if (cart) return cart.id;
  const [res] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return res.insertId;
}

// Reglas de descuento por cantidad (fallback si el producto no define bulk)
// Formato en .env: BULK_RULES="3:10,4:15"  => a partir de 3 (10%), a partir de 4 (15%)
const BULK_TIERS = (process.env.BULK_RULES || '3:10,4:15')
  .split(',')
  .map((p) => p.trim())
  .map((s) => {
    const [q, pc] = s.split(':').map((x) => parseInt(x, 10));
    return Number.isFinite(q) && Number.isFinite(pc) ? { min: q, percent: pc } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.min - b.min);

// Aplica descuentos por línea
function computeLineTotals(item) {
  const base = item.price * item.quantity;
  let discount = 0;
  if (item.discount_percent) discount += base * (item.discount_percent / 100);
  if (item.bulk_min_qty && item.bulk_percent && item.quantity >= item.bulk_min_qty) {
    discount += base * (item.bulk_percent / 100);
  } else {
    // Fallback con reglas por defecto si el producto no define bulk
    if (BULK_TIERS.length) {
      // Busca el mayor tier aplicable según la cantidad
      let tier = null;
      for (const t of BULK_TIERS) {
        if (item.quantity >= t.min) tier = t; else break;
      }
      if (tier) {
        discount += base * (tier.percent / 100);
      }
    }
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
              p.name, p.price,
              COALESCE(ci.custom_image, p.image) AS image,
              p.discount_percent, p.bulk_min_qty, p.bulk_percent,
              ci.design_id,
              IFNULL(i.stock,0) AS stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_inventory i ON i.product_id = p.id
       WHERE ci.cart_id = ?
       ORDER BY p.name`,
      [cartId]
    );
    // Override demo stock si aplica
    if (DEMO_STOCK !== null) {
      for (const r of rows) r.stock = DEMO_STOCK;
    }

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
    const { productId, qty, customImage } = req.body || {};
    let designId = req.body?.designId;
    const id = parseInt(productId, 10);
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'productId inválido' });
    designId = Number.isFinite(parseInt(designId, 10)) ? parseInt(designId, 10) : 0;

    const cartId = await getOrCreateCartId(req.user.id);
    // Insert básico
    await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, custom_image, design_id)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         quantity = quantity + VALUES(quantity),
         custom_image = COALESCE(VALUES(custom_image), custom_image),
         design_id = COALESCE(VALUES(design_id), design_id)`,
      [cartId, id, quantity, customImage || null, designId]
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
    const designId = Number.isFinite(parseInt(req.body?.designId, 10)) ? parseInt(req.body.designId, 10) : 0;
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'productId inválido' });

    const cartId = await getOrCreateCartId(req.user.id);
    const [result] = await db.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ? AND design_id = ?',
      [quantity, cartId, id, designId]
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
    const designId = Number.isFinite(parseInt(req.query?.designId, 10)) ? parseInt(req.query.designId, 10) : 0;
    const cartId = await getOrCreateCartId(req.user.id);
    await db.query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ? AND design_id = ?', [cartId, id, designId]);
    res.json({ message: 'Diseño eliminado del carrito' });
  } catch (err) {
    console.error('Error eliminando item:', err);
    res.status(500).json({ error: 'Error al eliminar del carrito' });
  }
});

// POST /api/cart/check-availability  -> comprueba todo el carrito
router.post('/check-availability', auth, async (req, res) => {
  try {
    if (DEMO_STOCK !== null) {
      return res.json({ ok: true, problems: [] });
    }
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
    if (DEMO_STOCK !== null) {
      // Modo demo: no tocar inventario, solo limpiar carrito
      await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
      await conn.commit();
      return res.json({ message: 'Compra realizada (demo). Existencias no afectadas.' });
    }
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
// New route: add item by articulo id, auto-creating or mapping to products
router.post('/items-from-articulo', auth, async (req, res) => {
  try {
    const { articuloId, qty } = req.body || {};
    const aId = parseInt(articuloId, 10);
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    if (!Number.isInteger(aId)) return res.status(400).json({ error: 'articuloId inválido' });

    // Get articulo
    const [[art]] = await db.query('SELECT id, nombre, precio, foto FROM articulos WHERE id = ?', [aId]);
    if (!art) return res.status(404).json({ error: 'Artículo no encontrado' });

    // Ensure product exists with same name
    let productId;
    const [[maybe]] = await db.query('SELECT id FROM products WHERE name = ? LIMIT 1', [art.nombre]);
    if (maybe) {
      productId = maybe.id;
      // Optionally update price/image to reflect articulo
      await db.query('UPDATE products SET price = ?, image = COALESCE(?, image) WHERE id = ?', [Math.round(art.precio || 0), art.foto || null, productId]);
    } else {
      const [ins] = await db.query(
        'INSERT INTO products (name, price, image, discount_percent, bulk_min_qty, bulk_percent) VALUES (?, ?, ?, 0, NULL, NULL)',
        [art.nombre, Math.round(art.precio || 0), art.foto || null]
      );
      productId = ins.insertId;
    }

    // Ensure inventory row exists
    const stockValue = DEMO_STOCK !== null ? DEMO_STOCK : 100;
    await db.query(
      'INSERT INTO product_inventory (product_id, stock) VALUES (?, ?) ON DUPLICATE KEY UPDATE stock = stock',
      [productId, stockValue]
    );

    // Add to cart with custom image of the articulo if provided
    const cartId = await getOrCreateCartId(req.user.id);
    await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, custom_image, design_id)
       VALUES (?, ?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), custom_image = COALESCE(VALUES(custom_image), custom_image)`,
      [cartId, productId, quantity, art.foto || null]
    );

    res.json({ message: 'Agregado al carrito desde artículo' });
  } catch (err) {
    console.error('Error agregando artículo al carrito:', err);
    res.status(500).json({ error: 'Error al agregar artículo al carrito' });
  }
});
