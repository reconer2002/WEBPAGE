const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const verifyPermiso = require('../middleware/permisos');

// GET /api/pedidos?estado=&usuario_id=&limit=&offset=
router.get('/', auth, verifyPermiso('ver_mantenedor'), async (req, res) => {
  try {
    const { estado, usuario_id, limit = 50, offset = 0 } = req.query;
    const params = [];
    let sql = `SELECT p.id, p.usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email,
                      p.costo, p.fecha, p.estado,
                      e.id AS envio_id, e.metodo AS envio_metodo, e.estado_envio,
                      CASE WHEN b.id IS NOT NULL THEN 'boleta' 
                           WHEN f.id IS NOT NULL THEN 'factura' 
                           ELSE NULL END AS tipo_documento
                 FROM pedidos p
                 JOIN usuarios u ON u.id = p.usuario_id
            LEFT JOIN envios e ON e.pedido_id = p.id
            LEFT JOIN boletas b ON b.pedido_id = p.id
            LEFT JOIN facturas f ON f.pedido_id = p.id
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

// GET /api/pedidos/:id/detalles - Obtener detalles del pedido con diseños
router.get('/:id/detalles', auth, verifyPermiso('ver_mantenedor'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    // Obtener items del pedido con información de diseños
    const [items] = await req.db.query(`
      SELECT 
        dp.id,
        dp.nombre_diseno,
        dp.datos,
        dp.costo,
        dp.objeto_id,
        o.articulo_id,
        a.nombre AS articulo_nombre,
        a.foto AS articulo_imagen,
        o.disenio_base_id,
        db.frente AS db_frente,
        db.espalda AS db_espalda,
        db.izquierda AS db_izquierda,
        db.derecha AS db_derecha
      FROM disenos_pedido dp
      LEFT JOIN objetos o ON o.id = dp.objeto_id
      LEFT JOIN articulos a ON a.id = o.articulo_id
      LEFT JOIN disenios_base db ON db.id = o.disenio_base_id
      WHERE dp.pedido_id = ?
    `, [id]);

    // Procesar datos JSON y elementos_por_vista
    const itemsConDatos = items.map(item => {
      const parse = (v, def) => {
        try {
          if (v == null) return def;
          if (typeof v === 'string') return JSON.parse(v);
          if (Array.isArray(v) || typeof v === 'object') return v;
          return def;
        } catch (_) { return def; }
      };

      // Parsear el campo datos que contiene elementos_por_vista, imagen_preview, etc.
      const datos = parse(item.datos, {});
      const elementosPorVista = datos.elementos_por_vista || {};
      const vistasDisponibles = Object.keys(elementosPorVista);

      // Construir imagenes_vistas
      const imagenesVistas = {};
      if (item.db_frente) imagenesVistas.frente = item.db_frente;
      if (item.db_espalda) imagenesVistas.detras = item.db_espalda;
      if (item.db_izquierda) imagenesVistas.izquierda = item.db_izquierda;
      if (item.db_derecha) imagenesVistas.derecha = item.db_derecha;

      return {
        id: item.id,
        cantidad: 1, // Los diseños en pedidos son únicos, cantidad siempre 1
        precio_unitario: Number(item.costo || 0),
        diseno_nombre: item.nombre_diseno,
        diseno_imagen: datos.imagen_preview || null,
        articulo_nombre: item.articulo_nombre,
        articulo_imagen: item.articulo_imagen,
        elementos_por_vista: elementosPorVista,
        imagenes_vistas: imagenesVistas,
        vistas_disponibles: vistasDisponibles,
        vista_actual: datos.vista_actual || (vistasDisponibles.length > 0 ? vistasDisponibles[0] : 'frente')
      };
    });

    res.json(itemsConDatos);
  } catch (err) {
    console.error('Error obteniendo detalles del pedido:', err);
    res.status(500).json({ error: 'Error al obtener detalles del pedido' });
  }
});

module.exports = router;