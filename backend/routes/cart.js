const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Demo stock: si DEMO_STOCK está definido en .env, forzamos ese stock en todas las respuestas
const DEMO_STOCK = Number.isFinite(parseInt(process.env.DEMO_STOCK, 10))
  ? parseInt(process.env.DEMO_STOCK, 10)
  : null;

// Detección y creación de columna cantidad en carrito_disenos para manejar cantidades reales
let HAS_QTY_COL = null;
async function hasQtyColumn() {
  if (HAS_QTY_COL !== null) return HAS_QTY_COL;
  const [[{ cnt }]] = await db.query(
    `SELECT COUNT(*) AS cnt
       FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'carrito_disenos'
        AND column_name = 'cantidad'`
  );
  HAS_QTY_COL = cnt > 0;
  if (!HAS_QTY_COL) {
    try {
      await db.query("ALTER TABLE carrito_disenos ADD COLUMN cantidad INT NOT NULL DEFAULT 1 AFTER diseno_id");
      HAS_QTY_COL = true;
    } catch (_) {
      HAS_QTY_COL = false;
    }
  }
  return HAS_QTY_COL;
}

// Util: obtiene o crea carrito del usuario en tablas del dump (carritos)
async function getOrCreateCartId(userId, dbConn) {
  const connection = dbConn || db;
  const [[car]] = await connection.query('SELECT id FROM carritos WHERE usuario_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  if (car) return car.id;
  const [res] = await connection.query('INSERT INTO carritos (usuario_id, cantidad_disenos, costo) VALUES (?, 0, 0)', [userId]);
  return res.insertId;
}

// Normaliza valores hacia JSON válido para columnas JSON (arrays)
function toJsonArrayOrNull(val) {
  if (val === undefined || val === null) return null;
  try {
    // Si viene como Buffer u objeto
    if (Buffer.isBuffer(val)) {
      const s = val.toString('utf8');
      if (s.trim().startsWith('[') || s.trim().startsWith('{')) { JSON.parse(s); return s; }
      return JSON.stringify([s]);
    }
    if (typeof val === 'string') {
      const s = val.trim();
      if (!s) return null;
      // Si ya es JSON, validar
      if (s.startsWith('[') || s.startsWith('{')) { JSON.parse(s); return s; }
      // Texto plano → array con un elemento
      return JSON.stringify([s]);
    }
    if (Array.isArray(val)) return JSON.stringify(val);
    // Objeto → intentar como está, si falla, envolver como string
    try { return JSON.stringify(val); } catch { return JSON.stringify([String(val)]) }
  } catch (_) {
    try { return JSON.stringify([String(val)]) } catch { return null }
  }
}

// Actualiza agregados de carritos (cantidad_disenos, costo)
async function updateCartTotals(cartId, dbConn) {
  const connection = dbConn || db;
  const hasQty = await hasQtyColumn();
  const [[row]] = await connection.query(
    `SELECT ${hasQty ? 'IFNULL(SUM(cd.cantidad),0)' : 'IFNULL(COUNT(*),0)'} AS cantidad,
            IFNULL(SUM(COALESCE(o.precio, a.precio) ${hasQty ? ' * cd.cantidad' : ''}),0) AS costo
       FROM carrito_disenos cd
       JOIN disenos d ON d.id = cd.diseno_id
       JOIN objetos o ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
      WHERE cd.carrito_id = ?`,
    [cartId]
  );
  await connection.query('UPDATE carritos SET cantidad_disenos = ?, costo = ? WHERE id = ?', [row.cantidad || 0, row.costo || 0, cartId]);
}

// Reglas de descuento por cantidad (fallback si el producto no define bulk)
const BULK_TIERS = (process.env.BULK_RULES || '3:10,4:15')
  .split(',')
  .map((p) => p.trim())
  .map((s) => {
    const [q, pc] = s.split(':').map((x) => parseInt(x, 10));
    return Number.isFinite(q) && Number.isFinite(pc) ? { min: q, percent: pc } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.min - b.min);

function computeLineTotals(item) {
  const base = item.price * item.quantity;
  let discount = 0;
  if (item.discount_percent) discount += base * (item.discount_percent / 100);
  if (item.bulk_min_qty && item.bulk_percent && item.quantity >= item.bulk_min_qty) {
    discount += base * (item.bulk_percent / 100);
  } else if (BULK_TIERS.length) {
    let tier = null;
    for (const t of BULK_TIERS) { if (item.quantity >= t.min) tier = t; else break; }
    if (tier) discount += base * (tier.percent / 100);
  }
  const total = Math.max(0, base - Math.floor(discount));
  return { base, discount: Math.floor(discount), total };
}

// GET /api/cart
router.get('/', auth, async (req, res) => {
  try {
    const cartId = await getOrCreateCartId(req.user.id);
    const hasQty = await hasQtyColumn();
    const [rows] = await db.query(
      `SELECT 
         cd.diseno_id        AS design_id,
         ${hasQty ? 'cd.cantidad' : '1'} AS quantity,
         a.id                AS product_id,
         a.nombre            AS name,
         d.nombre            AS design_name,
         COALESCE(o.precio, a.precio) AS price,
         COALESCE(d.imagen_preview, a.foto) AS image,
         a.descuento         AS discount_percent,
         NULL                AS bulk_min_qty,
         NULL                AS bulk_percent,
         IFNULL(o.existencias, 0) AS stock,
         d.objeto_id         AS objeto_id,
         CAST(d.elementos_por_vista AS CHAR) AS elementos_por_vista_raw
       FROM carrito_disenos cd
       JOIN disenos d  ON d.id = cd.diseno_id
       JOIN objetos o  ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
       WHERE cd.carrito_id = ?
       ORDER BY a.nombre`,
      [cartId]
    );
    if (DEMO_STOCK !== null) rows.forEach((r) => (r.stock = DEMO_STOCK));
    // Agregar por grupos (misma combinación de articulo/objeto/elementos)
    const groups = new Map();
    for (const r of rows) {
      const key = [
        r.product_id,
        r.objeto_id,
        r.elementos_por_vista_raw || 'null',
      ].join('|');
      if (!groups.has(key)) {
        groups.set(key, {
          product_id: r.product_id,
          name: r.name,
          design_name: r.design_name,
          price: Number(r.price || 0),
          image: r.image,
          discount_percent: r.discount_percent,
          bulk_min_qty: null,
          bulk_percent: null,
          stock: r.stock,
          design_id: r.design_id, // principal
          design_ids: [r.design_id],
          quantity: Number(r.quantity || 1),
        });
      } else {
        const g = groups.get(key);
        g.quantity += Number(r.quantity || 1);
        g.design_ids.push(r.design_id);
        // precio/stock/discount permanecen por unidad
      }
    }
    let base = 0, discount = 0, total = 0;
    const items = Array.from(groups.values()).map((r) => {
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

// POST /api/cart/items { designId }
router.post('/items', auth, async (req, res) => {
  try {
    const designId = Number.isFinite(parseInt(req.body?.designId, 10)) ? parseInt(req.body.designId, 10) : null;
    if (!designId) return res.status(400).json({ error: 'Se requiere designId' });
    
    // Verificar que el diseño existe y pertenece al usuario O es del superadmin
    const [[diseno]] = await req.db.query(
      `SELECT d.id, d.usuario_id, r.nombre AS rol_nombre
       FROM disenos d
       JOIN usuarios u ON u.id = d.usuario_id
       JOIN roles r ON r.id = u.rol_id
       WHERE d.id = ? AND (d.usuario_id = ? OR r.nombre = 'superadmin')`,
      [designId, req.user.id]
    );
    
    if (!diseno) return res.status(404).json({ error: 'Diseño no encontrado' });
    
    const cartId = await getOrCreateCartId(req.user.id, req.db);
    const hasQty = await hasQtyColumn();
    
    if (hasQty) {
      await req.db.query(
        'INSERT INTO carrito_disenos (carrito_id, diseno_id, cantidad) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE cantidad = cantidad + 1',
        [cartId, designId]
      );
    } else {
      await req.db.query('INSERT INTO carrito_disenos (carrito_id, diseno_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE diseno_id = diseno_id', [cartId, designId]);
    }
    
    await updateCartTotals(cartId, req.db);
    res.json({ message: 'Agregado al carrito' });
  } catch (err) {
    console.error('Error agregando al carrito:', err);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
});

// PATCH /api/cart/items/:productId { qty, designId } -> ajusta cantidad clonando/eliminando diseños equivalentes
router.patch('/items/:productId', auth, async (req, res) => {
  try {
    const desiredQty = Math.max(1, parseInt(req.body?.qty, 10) || 1);
    const designId = Number.isFinite(parseInt(req.body?.designId, 10)) ? parseInt(req.body.designId, 10) : null;
    if (!designId) return res.status(400).json({ error: 'designId requerido' });

    const cartId = await getOrCreateCartId(req.user.id);
    const hasQty = await hasQtyColumn();
    // Base del grupo: debe existir en el carrito del usuario
    const [[base]] = await db.query(
      `SELECT d.id, d.usuario_id, d.objeto_id, d.elementos_por_vista, d.costo
         FROM carrito_disenos cd
         JOIN disenos d ON d.id = cd.diseno_id
        WHERE cd.carrito_id = ? AND d.id = ?`,
      [cartId, designId]
    );
    if (!base) return res.status(404).json({ error: 'Diseño no encontrado en el carrito' });

    // Diseños equivalentes en este carrito
    const elemsEq = toJsonArrayOrNull(base.elementos_por_vista);
    const [equivs] = await db.query(
      `SELECT d.id ${hasQty ? ', cd.cantidad' : ''}
         FROM carrito_disenos cd
         JOIN disenos d ON d.id = cd.diseno_id
        WHERE cd.carrito_id = ?
          AND d.objeto_id = ?
          AND (d.elementos_por_vista <=> CAST(? AS JSON))`,
      [cartId, base.objeto_id, elemsEq]
    );
    const currentQty = hasQty ? equivs.reduce((s, e) => s + Number(e.cantidad || 0), 0) : equivs.length;
    if (currentQty === desiredQty) {
      // no-op
    } else if (hasQty) {
      // Consolidar en una sola fila base con la cantidad deseada
      await db.query('UPDATE carrito_disenos SET cantidad = ? WHERE carrito_id = ? AND diseno_id = ?', [desiredQty, cartId, base.id]);
      const ids = equivs.map((e) => e.id).filter((id) => id !== base.id);
      if (ids.length) {
        await db.query(
          `DELETE FROM carrito_disenos WHERE carrito_id = ? AND diseno_id IN (${ids.map(() => '?').join(',')})`,
          [cartId, ...ids]
        );
      }
    } else if (desiredQty > currentQty) {
      const toCreate = desiredQty - currentQty;
      for (let i = 0; i < toCreate; i++) {
        const elems = toJsonArrayOrNull(base.elementos_por_vista);
        const costoVal = Number(base.costo || 0);
        const [ins] = await db.query(
          `INSERT INTO disenos (usuario_id, objeto_id, elementos_por_vista, costo) VALUES (?, ?, ?, ?)`,
          [req.user.id, base.objeto_id, elems, costoVal]
        );
        await db.query(
          `INSERT INTO carrito_disenos (carrito_id, diseno_id) VALUES (?, ?)`,
          [cartId, ins.insertId]
        );
      }
    } else {
      const toRemove = currentQty - desiredQty;
      // No remover el diseño base si se puede; elimina otros equivalentes primero
      const ids = equivs.map((e) => e.id).filter((id) => id !== base.id);
      const removeIds = ids.slice(0, toRemove);
      if (removeIds.length) {
        await db.query(
          `DELETE FROM carrito_disenos WHERE carrito_id = ? AND diseno_id IN (${removeIds.map(() => '?').join(',')})`,
          [cartId, ...removeIds]
        );
      }
    }

    // Devolver estado actualizado del carrito (mismo shape que GET)
    await updateCartTotals(cartId);
    const [rows] = await db.query(
      `SELECT 
         cd.diseno_id        AS design_id,
         ${hasQty ? 'cd.cantidad' : '1'} AS quantity,
         a.id                AS product_id,
         a.nombre            AS name,
         d.nombre            AS design_name,
         COALESCE(o.precio, a.precio) AS price,
         COALESCE(d.imagen_preview, a.foto) AS image,
         a.descuento         AS discount_percent,
         NULL                AS bulk_min_qty,
         NULL                AS bulk_percent,
         IFNULL(o.existencias, 0) AS stock,
         d.objeto_id         AS objeto_id,
         CAST(d.elementos_por_vista AS CHAR) AS elementos_por_vista_raw
       FROM carrito_disenos cd
       JOIN disenos d  ON d.id = cd.diseno_id
       JOIN objetos o  ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
       WHERE cd.carrito_id = ?
       ORDER BY a.nombre`,
      [cartId]
    );
    if (DEMO_STOCK !== null) rows.forEach((r) => (r.stock = DEMO_STOCK));
    const groups = new Map();
    for (const r of rows) {
      const key = [r.product_id, r.objeto_id, r.elementos_por_vista_raw || 'null'].join('|');
      if (!groups.has(key)) {
        groups.set(key, {
          product_id: r.product_id,
          name: r.name,
          design_name: r.design_name,
          price: Number(r.price || 0),
          image: r.image,
          discount_percent: r.discount_percent,
          bulk_min_qty: null,
          bulk_percent: null,
          stock: r.stock,
          design_id: r.design_id,
          design_ids: [r.design_id],
          quantity: Number(r.quantity || 1),
        });
      } else {
        const g = groups.get(key);
        g.quantity += Number(r.quantity || 1); g.design_ids.push(r.design_id);
      }
    }
    const items = Array.from(groups.values());
    res.json({ items });
  } catch (err) {
    console.error('Error modificando cantidad:', err);
    res.status(500).json({ error: 'Error al modificar cantidad' });
  }
});

// DELETE /api/cart/items/:productId?designId=ID
router.delete('/items/:productId', auth, async (req, res) => {
  try {
    const designId = Number.isFinite(parseInt(req.query?.designId, 10)) ? parseInt(req.query.designId, 10) : null;
    if (!designId) return res.status(400).json({ error: 'designId requerido' });
    const cartId = await getOrCreateCartId(req.user.id);
    const hasQty = await hasQtyColumn();
    // Obtener base del grupo
    const [[base]] = await db.query(
      `SELECT d.id, d.objeto_id, d.elementos_por_vista
         FROM carrito_disenos cd
         JOIN disenos d ON d.id = cd.diseno_id
        WHERE cd.carrito_id = ? AND d.id = ?`,
      [cartId, designId]
    );
    if (!base) return res.status(404).json({ error: 'Diseño no encontrado en el carrito' });
    // Eliminar todo el grupo equivalente
    const elemsEq2 = toJsonArrayOrNull(base.elementos_por_vista);
    const [equivs] = await db.query(
      `SELECT d.id ${hasQty ? ', cd.cantidad' : ''}
         FROM carrito_disenos cd
         JOIN disenos d ON d.id = cd.diseno_id
        WHERE cd.carrito_id = ?
          AND d.objeto_id = ?
          AND (d.elementos_por_vista <=> CAST(? AS JSON))`,
      [cartId, base.objeto_id, elemsEq2]
    );
    // Siempre eliminar al menos la fila base
    await db.query('DELETE FROM carrito_disenos WHERE carrito_id = ? AND diseno_id = ?', [cartId, base.id]);
    if (!hasQty) {
      // En modo sin columna cantidad, eliminar equivalentes restantes del grupo
      const ids = equivs.map((e) => e.id).filter((id) => id !== base.id);
      if (ids.length) {
        await db.query(
          `DELETE FROM carrito_disenos WHERE carrito_id = ? AND diseno_id IN (${ids.map(() => '?').join(',')})`,
          [cartId, ...ids]
        );
      }
    }
    await updateCartTotals(cartId);
    // Responder con items actuales
    const [rows] = await db.query(
      `SELECT 
         cd.diseno_id        AS design_id,
         ${hasQty ? 'cd.cantidad' : '1'} AS quantity,
         a.id                AS product_id,
         a.nombre            AS name,
         d.nombre            AS design_name,
         COALESCE(o.precio, a.precio) AS price,
         COALESCE(d.imagen_preview, a.foto) AS image,
         a.descuento         AS discount_percent,
         NULL                AS bulk_min_qty,
         NULL                AS bulk_percent,
         IFNULL(o.existencias, 0) AS stock,
         d.objeto_id         AS objeto_id,
         CAST(d.elementos_por_vista AS CHAR) AS elementos_por_vista_raw
       FROM carrito_disenos cd
       JOIN disenos d  ON d.id = cd.diseno_id
       JOIN objetos o  ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
       WHERE cd.carrito_id = ?
       ORDER BY a.nombre`,
      [cartId]
    );
    const groups = new Map();
    for (const r of rows) {
      const key = [r.product_id, r.objeto_id, r.elementos_por_vista_raw || 'null'].join('|');
      if (!groups.has(key)) {
        groups.set(key, {
          product_id: r.product_id,
          name: r.name,
          design_name: r.design_name,
          price: Number(r.price || 0),
          image: r.image,
          discount_percent: r.discount_percent,
          bulk_min_qty: null,
          bulk_percent: null,
          stock: r.stock,
          design_id: r.design_id,
          design_ids: [r.design_id],
          quantity: Number(r.quantity || 1),
        });
      } else {
        const g = groups.get(key);
        g.quantity += Number(r.quantity || 1); g.design_ids.push(r.design_id);
      }
    }
    const items = Array.from(groups.values());
    res.json({ items });
  } catch (err) {
    console.error('Error eliminando item:', err);
    res.status(500).json({ error: 'Error al eliminar del carrito' });
  }
});

// POST /api/cart/check-availability
router.post('/check-availability', auth, async (req, res) => {
  try {
    if (DEMO_STOCK !== null) return res.json({ ok: true, problems: [] });
    const cartId = await getOrCreateCartId(req.user.id);
    const hasQty = await hasQtyColumn();
    const [rows] = await db.query(
      `SELECT a.id AS product_id, d.objeto_id, ${hasQty ? 'SUM(cd.cantidad)' : 'COUNT(*)'} AS quantity, IFNULL(o.existencias,0) AS stock
         FROM carrito_disenos cd
         JOIN disenos d  ON d.id = cd.diseno_id
         JOIN objetos o  ON o.id = d.objeto_id
         JOIN articulos a ON a.id = o.articulo_id
        WHERE cd.carrito_id = ?
        GROUP BY a.id, d.objeto_id, o.existencias`,
      [cartId]
    );
    const problems = rows.filter(r => Number(r.stock) < Number(r.quantity));
    res.json({ ok: problems.length === 0, problems });
  } catch (err) {
    console.error('Error comprobando disponibilidad:', err);
    res.status(500).json({ error: 'Error al comprobar disponibilidad' });
  }
});

// POST /api/cart/checkout -> descuenta stock y limpia carrito
router.post('/checkout', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const cartId = await getOrCreateCartId(req.user.id);
    await conn.beginTransaction();
    const hasQty = await hasQtyColumn();
    const [items] = await conn.query(
      `SELECT d.id AS diseno_id, d.objeto_id ${hasQty ? ', cd.cantidad' : ''}
         FROM carrito_disenos cd
         JOIN disenos d ON d.id = cd.diseno_id
        WHERE cd.carrito_id = ? FOR UPDATE`,
      [cartId]
    );
    if (DEMO_STOCK !== null) {
      await conn.query('DELETE FROM carrito_disenos WHERE carrito_id = ?', [cartId]);
      await conn.commit();
      await updateCartTotals(cartId);
      return res.json({ message: 'Compra realizada (demo). Existencias no afectadas.' });
    }
    for (const it of items) {
      const qty = hasQty ? Number(it.cantidad || 0) : 1;
      const [[obj]] = await conn.query('SELECT id, existencias FROM objetos WHERE id = ? FOR UPDATE', [it.objeto_id]);
      if (!obj || Number(obj.existencias) < qty) {
        await conn.rollback();
        return res.status(409).json({ error: 'Stock insuficiente', problems: [{ objeto_id: it.objeto_id, stock: obj ? obj.existencias : 0 }] });
      }
      await conn.query('UPDATE objetos SET existencias = existencias - ? WHERE id = ?', [qty, it.objeto_id]);
    }
    await conn.query('DELETE FROM carrito_disenos WHERE carrito_id = ?', [cartId]);
    await conn.commit();
    await updateCartTotals(cartId);
    res.json({ message: 'Compra realizada. Existencias actualizadas.' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Error en checkout:', err);
    res.status(500).json({ error: 'Error al finalizar compra' });
  } finally {
    try { conn.release(); } catch (_) {}
  }
});

// Agregar ítem al carrito desde un articuloId: crea un diseño mínimo y lo asocia al carrito
router.post('/items-from-articulo', auth, async (req, res) => {
  try {
    const aId = parseInt(req.body?.articuloId, 10);
    const qty = Math.max(1, parseInt(req.body?.qty, 10) || 1);
    if (!Number.isInteger(aId)) return res.status(400).json({ error: 'articuloId inválido' });
    const [[obj]] = await db.query(
      `SELECT id, precio FROM objetos WHERE articulo_id = ? ORDER BY existencias DESC, id ASC LIMIT 1`,
      [aId]
    );
    if (!obj) return res.status(404).json({ error: 'El artículo no tiene objetos disponibles' });
    // Reutilizar un diseño mínimo (elementos_por_vista NULL) por usuario+objeto
    const [[existing]] = await db.query(
      `SELECT id FROM disenos 
         WHERE usuario_id = ? AND objeto_id = ? AND elementos_por_vista IS NULL
         ORDER BY id DESC LIMIT 1`,
      [req.user.id, obj.id]
    );
    let designId;
    if (existing) designId = existing.id; else {
      const [ins] = await db.query(
        `INSERT INTO disenos (usuario_id, objeto_id, costo) VALUES (?, ?, ?)`,
        [req.user.id, obj.id, Number(obj.precio || 0)]
      );
      designId = ins.insertId;
    }
    const cartId = await getOrCreateCartId(req.user.id);
    const hasQty = await hasQtyColumn();
    if (hasQty) {
      await db.query(
        'INSERT INTO carrito_disenos (carrito_id, diseno_id, cantidad) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)',
        [cartId, designId, qty]
      );
    } else {
      for (let i = 0; i < qty; i++) {
        await db.query('INSERT INTO carrito_disenos (carrito_id, diseno_id) VALUES (?, ?)', [cartId, designId]);
      }
    }
    await updateCartTotals(cartId);
    res.json({ message: 'Agregado al carrito desde artículo' });
  } catch (err) {
    console.error('Error agregando artículo al carrito:', err);
    res.status(500).json({ error: 'Error al agregar artículo al carrito' });
  }
});

module.exports = router;
