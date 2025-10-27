const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'secret';

// === Util: cálculo de envío para RM (Santiago) ===
const strip = (s='') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const ZONES = {
  centro: { price: 2990, comunas: ['santiago','providencia','nunoa','las condes','vitacura','lo barnechea','recoleta','independencia','macul','san miguel','estacion central'] },
  pericentro: { price: 3990, comunas: ['la reina','penalolen','quinta normal','san joaquin','la cisterna','san ramon','pedro aguirre cerda','lo prado','cerrillos','huechuraba'] },
  periferia: { price: 5990, comunas: ['maipu','la florida','puente alto','la granja','el bosque','renca','conchali','quilicura','cerro navia','pudahuel'] },
  extremo: { price: 8990, comunas: ['padre hurtado','san bernardo','buin','lampa','colina','tiltil','paine','penaflor','talagante','calera de tango','isla de maipo','melipilla'] },
};
function estimateShipping(shipping) {
  const metodo = (shipping?.metodo || 'delivery').toLowerCase();
  if (metodo === 'retiro') return { zone: 'retiro', price: 0 };
  const comuna = strip(shipping?.comuna || '');
  for (const [zone, cfg] of Object.entries(ZONES)) {
    if (cfg.comunas.some((c) => strip(c) === comuna)) return { zone, price: cfg.price };
  }
  const region = strip(shipping?.region || '');
  if (region && !['rm','metropolitana','region metropolitana'].includes(region)) return { zone: 'fuera_rm', price: 12990 };
  return { zone: 'periferia', price: ZONES.periferia.price };
}

// Util: detectar si existe columna cantidad en carrito_disenos
let HAS_QTY_COL = null;
async function hasQtyColumn(conn) {
  if (HAS_QTY_COL !== null) return HAS_QTY_COL;
  const c = conn || db;
  const [[{ cnt }]] = await c.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'carrito_disenos' AND column_name = 'cantidad'`
  );
  HAS_QTY_COL = cnt > 0;
  return HAS_QTY_COL;
}

async function getOrCreateCartId(userId) {
  const [[car]] = await db.query('SELECT id FROM carritos WHERE usuario_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  if (car) return car.id;
  const [res] = await db.query('INSERT INTO carritos (usuario_id, cantidad_disenos, costo) VALUES (?, 0, 0)', [userId]);
  return res.insertId;
}

// Calcula items y totales del carrito (mismo criterio que cart route)
async function computeCartSummary(userId) {
  const cartId = await getOrCreateCartId(userId);
  const hasQty = await hasQtyColumn();
  const [rows] = await db.query(
    `SELECT 
       cd.diseno_id        AS design_id,
       ${hasQty ? 'cd.cantidad' : '1'} AS quantity,
       a.id                AS product_id,
       a.nombre            AS name,
       COALESCE(o.precio, a.precio) AS price,
       COALESCE(JSON_UNQUOTE(JSON_EXTRACT(d.imagenes, '$[0]')), a.foto) AS image,
       a.descuento         AS discount_percent,
       IFNULL(inv.stock, 0) AS stock,
       d.objeto_id         AS objeto_id,
       CAST(d.imagenes AS CHAR) AS imagenes_raw,
       CAST(d.textos   AS CHAR) AS textos_raw
     FROM carrito_disenos cd
     JOIN disenos d  ON d.id = cd.diseno_id
     JOIN objetos o  ON o.id = d.objeto_id
     JOIN articulos a ON a.id = o.articulo_id
     LEFT JOIN (
       SELECT articulo_id, SUM(existencias) AS stock FROM objetos GROUP BY articulo_id
     ) inv ON inv.articulo_id = a.id
     WHERE cd.carrito_id = ?
     ORDER BY a.nombre`,
    [cartId]
  );
  const groups = new Map();
  for (const r of rows) {
    const key = [r.product_id, r.objeto_id, r.imagenes_raw || 'null', r.textos_raw || 'null'].join('|');
    if (!groups.has(key)) {
      groups.set(key, {
        product_id: r.product_id,
        name: r.name,
        price: Number(r.price || 0),
        image: r.image,
        discount_percent: r.discount_percent,
        stock: r.stock,
        objeto_id: r.objeto_id,
        design_id: r.design_id,
        design_ids: [r.design_id],
        quantity: Number(r.quantity || 1),
      });
    } else {
      const g = groups.get(key);
      g.quantity += Number(r.quantity || 1);
      g.design_ids.push(r.design_id);
    }
  }
  const items = Array.from(groups.values());
  let base = 0, discount = 0, total = 0;
  const bulkRules = String(process.env.BULK_RULES || '3:10,4:15')
    .split(',').map((p) => p.trim()).map((s) => {
      const [q, pc] = s.split(':').map((x) => parseInt(x, 10));
      return Number.isFinite(q) && Number.isFinite(pc) ? { min: q, percent: pc } : null;
    }).filter(Boolean).sort((a,b)=>a.min-b.min);
  for (const it of items) {
    const lineBase = it.price * it.quantity;
    let lineDiscount = 0;
    if (it.discount_percent) lineDiscount += lineBase * (it.discount_percent / 100);
    let tier = null;
    for (const t of bulkRules) { if (it.quantity >= t.min) tier = t; else break; }
    if (tier) lineDiscount += lineBase * (tier.percent / 100);
    const lineTotal = Math.max(0, lineBase - Math.floor(lineDiscount));
    base += lineBase; discount += Math.floor(lineDiscount); total += lineTotal;
  }
  return { cartId, items, totals: { base, discount, total } };
}

// Verifica stock
async function checkAvailability(userId) {
  const cartId = await getOrCreateCartId(userId);
  const hasQty = await hasQtyColumn();
  const [rows] = await db.query(
    `SELECT a.id AS product_id, ${hasQty ? 'SUM(cd.cantidad)' : 'COUNT(*)'} AS quantity, IFNULL(inv.stock,0) AS stock
       FROM carrito_disenos cd
       JOIN disenos d  ON d.id = cd.diseno_id
       JOIN objetos o  ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
       LEFT JOIN (
         SELECT articulo_id, SUM(existencias) AS stock FROM objetos GROUP BY articulo_id
       ) inv ON inv.articulo_id = a.id
      WHERE cd.carrito_id = ?
      GROUP BY a.id, inv.stock`,
    [cartId]
  );
  const problems = rows.filter(r => Number(r.stock) < Number(r.quantity));
  return { ok: problems.length === 0, problems };
}

// GET /api/checkout/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const data = await computeCartSummary(req.user.id);
    res.json(data);
  } catch (err) {
    console.error('Error en summary checkout:', err);
    res.status(500).json({ error: 'Error al obtener resumen de checkout' });
  }
});

// POST /api/checkout/session -> prepara pedido y retorna instrucción de pago (mock provider)
router.post('/session', auth, async (req, res) => {
  try {
    const { docType, docData } = req.body || {};
    const availability = await checkAvailability(req.user.id);
    if (!availability.ok) return res.status(409).json({ error: 'Stock insuficiente', problems: availability.problems });
    const summary = await computeCartSummary(req.user.id);
    const orderTotal = Number(summary.totals.total || 0);
    const cartId = summary.cartId;

    // Crear pedido en estado pendiente
    const [ins] = await db.query(
      `INSERT INTO pedidos (usuario_id, carrito_id, costo, fecha, estado) VALUES (?, ?, ?, NOW(), ?)`,
      [req.user.id, cartId, orderTotal, 'pendiente']
    );
    const orderId = ins.insertId;

    // Generar token firmado (sin guardar en BD)
    const { shipping } = req.body || {};
    const calc = estimateShipping(shipping || {});
    const totalWithShipping = orderTotal + (calc?.price || 0);
    // Actualizar costo del pedido para que incluya envío
    await db.query('UPDATE pedidos SET costo = ? WHERE id = ?', [totalWithShipping, orderId]);
    const token = jwt.sign({ orderId, uid: req.user.id, total: totalWithShipping, doc: { type: docType || null, data: docData || null }, ship: { ...(shipping || {}), _calc: calc } }, SECRET, { expiresIn: '30m' });
    const redirectUrl = `/checkout/mock?orderId=${orderId}&token=${encodeURIComponent(token)}`;

    res.json({ orderId, provider: 'mock', redirectUrl, token, total: totalWithShipping });
  } catch (err) {
    console.error('Error creando sesión de pago:', err);
    res.status(500).json({ error: 'Error creando sesión de pago' });
  }
});

// POST /api/checkout/mock/confirm { orderId, token, status: 'approved'|'rejected' }
router.post('/mock/confirm', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { orderId, token, status } = req.body || {};
    if (!orderId || !token) return res.status(400).json({ error: 'orderId y token son requeridos' });
    // Verificar token
    let payload;
    try { payload = jwt.verify(token, SECRET); } catch (_) { return res.status(401).json({ error: 'Token inválido' }); }
    if (Number(payload.orderId) !== Number(orderId) || Number(payload.uid) !== Number(req.user.id)) {
      return res.status(401).json({ error: 'Token de orden no coincide' });
    }
    const [[ord]] = await conn.query('SELECT id, usuario_id, carrito_id, costo, estado FROM pedidos WHERE id = ? FOR UPDATE', [orderId]);
    if (!ord || ord.usuario_id !== req.user.id) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (status !== 'approved') {
      await conn.query('UPDATE pedidos SET estado = ? WHERE id = ?', ['cancelado', orderId]);
      return res.json({ orderId, status: 'cancelado' });
    }

    // Confirmar: antes de vaciar el carrito, obtener un resumen para almacenar items del pedido
    let summaryForOrder = null;
    try {
      summaryForOrder = await computeCartSummary(req.user.id);
    } catch (_) {}

    // Confirmar: descontar stock y vaciar carrito (basado en cart checkout)
    await conn.beginTransaction();
    const hasQty = await hasQtyColumn(conn);
    const [items] = await conn.query(
      `SELECT d.id AS diseno_id, d.objeto_id ${hasQty ? ', cd.cantidad' : ''}
         FROM carrito_disenos cd
         JOIN disenos d ON d.id = cd.diseno_id
        WHERE cd.carrito_id = ? FOR UPDATE`,
      [ord.carrito_id]
    );
    for (const it of items) {
      const qty = hasQty ? Number(it.cantidad || 0) : 1;
      const [[obj]] = await conn.query('SELECT id, existencias FROM objetos WHERE id = ? FOR UPDATE', [it.objeto_id]);
      if (!obj || Number(obj.existencias) < qty) {
        await conn.rollback();
        await conn.query('UPDATE pedidos SET estado = ? WHERE id = ?', ['rechazado', orderId]);
        return res.status(409).json({ error: 'Stock insuficiente al confirmar', problems: [{ objeto_id: it.objeto_id, stock: obj ? obj.existencias : 0 }] });
      }
      await conn.query('UPDATE objetos SET existencias = existencias - ? WHERE id = ?', [qty, it.objeto_id]);
    }
    await conn.query('DELETE FROM carrito_disenos WHERE carrito_id = ?', [ord.carrito_id]);
    await conn.query('UPDATE pedidos SET estado = ? WHERE id = ?', ['pagado', orderId]);

    // Persistir items del pedido (resumen) para futuras consultas (e.g., Mis compras con imagen)
    try {
      if (summaryForOrder && Array.isArray(summaryForOrder.items)) {
        for (const it of summaryForOrder.items) {
          const unitPrice = Number(it.price || 0);
          const objId = Number(it.objeto_id || 0) || null;
          const datos = JSON.stringify({ image: it.image, product_id: it.product_id, name: it.name });
          // Insertar una fila por cada diseño involucrado
          const ids = Array.isArray(it.design_ids) ? it.design_ids : (it.design_id ? [it.design_id] : []);
          for (const did of ids) {
            await conn.query(
              `INSERT INTO disenos_pedido (pedido_id, usuario_id, objeto_id, nombre_diseno, datos, costo)
               VALUES (?, ?, ?, ?, ?, ?)` ,
              [orderId, req.user.id, objId, String(it.name || 'Diseño'), datos, unitPrice]
            );
          }
        }
      }
    } catch (e) {
      // No bloquear el pago por este registro auxiliar
      console.warn('No se pudo persistir disenos_pedido para pedido', orderId, e?.message);
    }

    // Insertar documento tributario según doc en token, sin alterar esquema
    const doc = payload?.doc || {};
    if (doc?.type === 'boleta') {
      // Fallbacks desde configuracion_pagina si existen
      const [[cfg]] = await conn.query('SELECT telefono1, correo_contacto, direccion FROM configuracion_pagina ORDER BY id ASC LIMIT 1');
      const b = doc.data || {};
      const now = new Date();
      await conn.query(
        `INSERT INTO boletas (pedido_id, nombre_responsable, rut_responsable, razon_social, direccion_casa_matriz, telefono_contacto, gmail, direccion_web, fecha_emision, monto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)` ,
        [
          orderId,
          String(b.nombre_responsable || 'N/A'),
          String(b.rut_responsable || 'N/A'),
          String(b.razon_social || 'N/A'),
          String(b.direccion_casa_matriz || cfg?.direccion || 'N/A'),
          String(b.telefono_contacto || cfg?.telefono1 || 'N/A'),
          String(b.gmail || cfg?.correo_contacto || 'N/A'),
          b.direccion_web ? String(b.direccion_web) : null,
          Number(ord.costo || 0),
        ]
      );
    } else if (doc?.type === 'factura') {
      const [[cfg]] = await conn.query('SELECT telefono1, direccion FROM configuracion_pagina ORDER BY id ASC LIMIT 1');
      const f = doc.data || {};
      await conn.query(
        `INSERT INTO facturas (
            pedido_id, nombre_responsable, rut_responsable, razon_social, direccion_casa_matriz, telefono_contacto,
            nombre_cliente, rut_cliente, giro, direccion, comuna, telefono, ciudad, referencia
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          orderId,
          String(f.nombre_responsable || 'N/A'),
          String(f.rut_responsable || 'N/A'),
          String(f.razon_social || 'N/A'),
          String(f.direccion_casa_matriz || cfg?.direccion || 'N/A'),
          String(f.telefono_contacto || cfg?.telefono1 || 'N/A'),
          String(f.nombre_cliente || 'N/A'),
          String(f.rut_cliente || 'N/A'),
          String(f.giro || 'N/A'),
          String(f.direccion || 'N/A'),
          String(f.comuna || 'N/A'),
          String(f.telefono || 'N/A'),
          String(f.ciudad || 'N/A'),
          f.referencia ? String(f.referencia) : null,
        ]
      );
    }
    // Crear registro de envío
    const ship = payload?.ship || {};
    const calcShip = estimateShipping(ship);
    const metodo = ship?.metodo || 'delivery';
    const [insEnv] = await conn.query(
      `INSERT INTO envios (
         pedido_id, metodo, receptor_nombre, receptor_telefono, direccion, comuna, ciudad, region, instrucciones,
         costo_envio, carrier, tracking, estado_envio
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        orderId,
        String(metodo),
        ship?.receptor_nombre ? String(ship.receptor_nombre) : null,
        ship?.receptor_telefono ? String(ship.receptor_telefono) : null,
        ship?.direccion ? String(ship.direccion) : null,
        ship?.comuna ? String(ship.comuna) : null,
        ship?.ciudad ? String(ship.ciudad) : null,
        ship?.region ? String(ship.region) : null,
        ship?.instrucciones ? String(ship.instrucciones) : null,
        Number(calcShip?.price || 0),
        ship?.carrier ? String(ship.carrier) : null,
        ship?.tracking ? String(ship.tracking) : null,
        String(ship?.estado_envio || 'pendiente'),
      ]
    );
    // Registrar historial inicial del envío
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS envio_eventos (
          id BIGINT NOT NULL AUTO_INCREMENT,
          envio_id BIGINT NOT NULL,
          estado VARCHAR(50) NOT NULL,
          detalle VARCHAR(255) NULL,
          creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY envio_idx (envio_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
      await conn.query('INSERT INTO envio_eventos (envio_id, estado, detalle) VALUES (?, ?, ?)', [insEnv.insertId, String(ship?.estado_envio || 'pendiente'), 'Envío registrado']);
    } catch (_) {}
    await conn.commit();
    res.json({ orderId, status: 'pagado' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Error confirmando pago mock:', err);
    res.status(500).json({ error: 'Error confirmando pago' });
  } finally {
    try { conn.release(); } catch (_) {}
  }
});

// Hook para webhooks reales (Transbank u otros): stub preparado
router.post('/provider/notify', async (req, res) => {
  // Aquí se validaría firma y se actualizaría el pedido por referencia
  res.json({ ok: true });
});

module.exports = router;
