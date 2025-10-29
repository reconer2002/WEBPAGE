const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const verifyPermiso = require('../middleware/permisos');

// GET /api/pedidos?estado=&usuario_id=&limit=&offset=
router.get('/', auth, verifyPermiso('ver_mantenedor'), async (req, res) => {
  try {
    const { estado, usuario_id, limit = 50, offset = 0 } = req.query;
    const params = [];
    // Ensure envio_reviews table exists so LEFT JOIN won't fail on older DB dumps
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

    let sql = `SELECT p.id, p.usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email,
                      p.costo, p.fecha, p.estado,
                      e.id AS envio_id, e.metodo AS envio_metodo, e.estado_envio,
                      er.estrellas AS envio_estrellas, er.comentario AS envio_comentario, er.creado_en AS envio_review_date
                 FROM pedidos p
                 JOIN usuarios u ON u.id = p.usuario_id
            LEFT JOIN envios e ON e.pedido_id = p.id
            LEFT JOIN envio_reviews er ON er.envio_id = e.id
                WHERE 1=1`;
    if (estado) { sql += ' AND p.estado = ?'; params.push(String(estado)); }
    if (usuario_id) { sql += ' AND p.usuario_id = ?'; params.push(parseInt(usuario_id, 10)); }
    sql += ' ORDER BY p.fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);
    const [rows] = await req.db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listando pedidos:', err);
    res.status(500).json({ error: 'Error al listar pedidos' });
  }
});

// PATCH /api/pedidos/:id { estado }
router.patch('/:id', auth, verifyPermiso('ver_mantenedor'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { estado } = req.body || {};
    const allowed = ['pendiente', 'pagado', 'rechazado', 'cancelado'];
    if (!allowed.includes(String(estado))) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const [r] = await req.db.query('UPDATE pedidos SET estado = ? WHERE id = ?', [String(estado), id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    // Update envío si cancelado
    if (estado === 'cancelado') {
      try { await req.db.query('UPDATE envios SET estado_envio = ? WHERE pedido_id = ?', ['cancelado', id]); } catch (_) {}
    }
    res.json({ message: 'Pedido actualizado' });
  } catch (err) {
    console.error('Error actualizando pedido:', err);
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

module.exports = router;