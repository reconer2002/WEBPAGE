const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const verifyPermiso = require('../middleware/permisos');

// Helpers: historial de envíos
async function ensureEventoTable(conn) {
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
}

async function insertEvento(conn, envioId, estado, detalle = null) {
  await ensureEventoTable(conn);
  await conn.query(
    'INSERT INTO envio_eventos (envio_id, estado, detalle) VALUES (?, ?, ?)',
    [envioId, String(estado), detalle ? String(detalle) : null]
  );
}

// GET /api/envios/mios - envíos del usuario autenticado
router.get('/mios', auth, async (req, res) => {
  try {
    const [rows] = await req.db.query(
      `SELECT e.*, p.costo AS total_pedido,
              JSON_UNQUOTE(JSON_EXTRACT(dp.datos, '$.image')) AS image,
              dp.nombre_diseno
         FROM envios e
         JOIN pedidos p ON p.id = e.pedido_id
    LEFT JOIN (
           SELECT x.pedido_id, MIN(x.id) AS any_dp_id
             FROM disenos_pedido x
            GROUP BY x.pedido_id
           ) pick ON pick.pedido_id = e.pedido_id
    LEFT JOIN disenos_pedido dp ON dp.id = pick.any_dp_id
        WHERE p.usuario_id = ?
        ORDER BY e.creado_en DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando mis envíos:', err);
    res.status(500).json({ error: 'Error al obtener envíos' });
  }
});

// GET /api/envios - lista administrativa
router.get('/', auth, verifyPermiso('ver_mantenedor'), async (req, res) => {
  try {
    const { estado, pedido_id, usuario_id, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT e.*, p.usuario_id, p.costo AS total_pedido FROM envios e JOIN pedidos p ON p.id = e.pedido_id WHERE 1=1`;
    const params = [];
    if (estado) { sql += ' AND e.estado_envio = ?'; params.push(estado); }
    if (pedido_id) { sql += ' AND e.pedido_id = ?'; params.push(parseInt(pedido_id, 10)); }
    if (usuario_id) { sql += ' AND p.usuario_id = ?'; params.push(parseInt(usuario_id, 10)); }
    sql += ' ORDER BY e.creado_en DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);
    const [rows] = await req.db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listando envíos:', err);
    res.status(500).json({ error: 'Error al listar envíos' });
  }
});

// GET /api/envios/:id - ver un envío (propietario o mantenedor)
router.get('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[row]] = await req.db.query(
      `SELECT e.*, p.usuario_id FROM envios e JOIN pedidos p ON p.id = e.pedido_id WHERE e.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Envío no encontrado' });
    if (row.usuario_id !== req.user.id) {
      // verificar permiso mantenedor
      // fallback simple: negar si no es del usuario
      return res.status(403).json({ error: 'No autorizado' });
    }
    res.json(row);
  } catch (err) {
    console.error('Error obteniendo envío:', err);
    res.status(500).json({ error: 'Error al obtener envío' });
  }
});

// PATCH /api/envios/:id - actualizar (admin)
router.patch('/:id', auth, verifyPermiso('ver_mantenedor'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { estado_envio, carrier, tracking, costo_envio, instrucciones } = req.body || {};
    const sets = [], vals = [];
    if (estado_envio) { sets.push('estado_envio = ?'); vals.push(estado_envio); }
    if (carrier !== undefined) { sets.push('carrier = ?'); vals.push(carrier || null); }
    if (tracking !== undefined) { sets.push('tracking = ?'); vals.push(tracking || null); }
    if (costo_envio !== undefined) { sets.push('costo_envio = ?'); vals.push(Number(costo_envio) || 0); }
    if (instrucciones !== undefined) { sets.push('instrucciones = ?'); vals.push(instrucciones || null); }
    if (!sets.length) return res.json({ message: 'Sin cambios' });
    vals.push(id);
    await req.db.query(`UPDATE envios SET ${sets.join(', ')} WHERE id = ?`, vals);
    if (estado_envio) {
      try { await insertEvento(req.db, id, estado_envio, 'Actualizado por mantenedor'); } catch (_) {}
    }
    res.json({ message: 'Envío actualizado' });
  } catch (err) {
    console.error('Error actualizando envío:', err);
    res.status(500).json({ error: 'Error al actualizar envío' });
  }
});

// GET /api/envios/:id/historial - historial para dueño del pedido
router.get('/:id/historial', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[row]] = await req.db.query(
      `SELECT e.id, p.usuario_id FROM envios e JOIN pedidos p ON p.id = e.pedido_id WHERE e.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Envío no encontrado' });
    if (row.usuario_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });
    await ensureEventoTable(req.db);
    const [events] = await req.db.query(
      `SELECT id, estado, detalle, creado_en FROM envio_eventos WHERE envio_id = ? ORDER BY creado_en ASC, id ASC`,
      [id]
    );
    res.json(events);
  } catch (err) {
    console.error('Error obteniendo historial de envío:', err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// POST /api/envios/:id/review - agregar o actualizar reseña del envío (usuario dueño)
router.post('/:id/review', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { estrellas, comentario } = req.body || {};
    if (typeof estrellas !== 'number' || estrellas < 1 || estrellas > 5) {
      return res.status(400).json({ error: 'Estrellas inválidas (1-5)' });
    }

    // verificar que el envio pertenece al usuario
    const [[row]] = await req.db.query(
      `SELECT e.id, e.estado_envio, p.usuario_id FROM envios e JOIN pedidos p ON p.id = e.pedido_id WHERE e.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Envío no encontrado' });
    if (row.usuario_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    const allowed = ['en_transito', 'entregado'];
    if (!allowed.includes(String(row.estado_envio || '').toLowerCase())) {
      return res.status(400).json({ error: 'No se puede reseñar hasta que el pedido esté en curso o entregado' });
    }

    // Asegurar tabla de reseñas (nombre ASCII)
    await req.db.query(`
      CREATE TABLE IF NOT EXISTS envio_reviews (
        id BIGINT NOT NULL AUTO_INCREMENT,
        envio_id BIGINT NOT NULL,
        usuario_id BIGINT NOT NULL,
        estrellas TINYINT NOT NULL,
        comentario TEXT NULL,
        creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY envio_usuario_unique (envio_id, usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insertar o actualizar reseña (upsert)
    await req.db.query(
      `INSERT INTO envio_reviews (envio_id, usuario_id, estrellas, comentario)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE estrellas = VALUES(estrellas), comentario = VALUES(comentario), creado_en = CURRENT_TIMESTAMP`,
      [id, req.user.id, estrellas, comentario || null]
    );

    res.json({ message: 'Reseña guardada' });
  } catch (err) {
    console.error('Error guardando reseña:', err);
    res.status(500).json({ error: 'Error al guardar reseña' });
  }
});

// GET /api/envios/:id/review - obtener reseña del envio por el usuario (si existe)
router.get('/:id/review', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[row]] = await req.db.query(
      `SELECT e.id, p.usuario_id FROM envios e JOIN pedidos p ON p.id = e.pedido_id WHERE e.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Envío no encontrado' });
    if (row.usuario_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    // intentar leer reseña
    await req.db.query(`CREATE TABLE IF NOT EXISTS envio_reviews (
      id BIGINT NOT NULL AUTO_INCREMENT,
      envio_id BIGINT NOT NULL,
      usuario_id BIGINT NOT NULL,
      estrellas TINYINT NOT NULL,
      comentario TEXT NULL,
      creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY envio_usuario_unique (envio_id, usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    const [rows] = await req.db.query('SELECT estrellas, comentario, creado_en FROM envio_reviews WHERE envio_id = ? AND usuario_id = ? LIMIT 1', [id, req.user.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'No hay reseña' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error obteniendo reseña:', err);
    res.status(500).json({ error: 'Error al obtener reseña' });
  }
});

module.exports = router;