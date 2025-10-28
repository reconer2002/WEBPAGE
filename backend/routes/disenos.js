const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");

// GET /api/disenos - Obtener diseños del usuario
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         d.id,
         d.usuario_id,
         d.objeto_id,
         d.nombre,
         d.imagen_preview,
         d.costo,
         d.fecha_creacion,
         d.fecha_modificacion,
         o.articulo_id,
         o.precio AS objeto_precio,
         o.existencias AS stock,
         a.nombre AS articulo_nombre,
         a.foto AS articulo_imagen,
         COALESCE(d.imagen_preview, a.foto) AS imagen,
         COALESCE(o.precio, a.precio) AS precio
       FROM disenos d
       JOIN objetos o ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
       WHERE d.usuario_id = ?
       ORDER BY d.fecha_modificacion DESC`,
      [req.user.id]
    );

    const data = rows.map((r) => ({
      id: r.id,
      usuario_id: r.usuario_id,
      articulo_id: r.articulo_id,
      objeto_id: r.objeto_id,
      nombre: r.nombre,
      imagen: r.imagen,
      precio: Number(r.precio || 0),
      stock: Number(r.stock || 0),
      costo: Number(r.costo || 0),
      articulo_nombre: r.articulo_nombre,
      articulo_imagen: r.articulo_imagen,
      fecha_creacion: r.fecha_creacion,
      fecha_modificacion: r.fecha_modificacion,
    }));

    res.json(data);
  } catch (err) {
    console.error("Error obteniendo diseños:", err);
    res.status(500).json({ error: "Error al obtener diseños" });
  }
});

// GET /api/disenos/:id - Obtener un diseño con todos sus atributos para edición
router.get('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[row]] = await db.query(
      `SELECT d.*, o.articulo_id, a.nombre AS articulo_nombre, a.foto AS articulo_imagen
         FROM disenos d
         JOIN objetos o ON o.id = d.objeto_id
         JOIN articulos a ON a.id = o.articulo_id
        WHERE d.id = ? AND d.usuario_id = ?
        LIMIT 1`,
      [id, req.user.id]
    );
    if (!row) return res.status(404).json({ error: 'Diseño no encontrado' });

    const parse = (v, def) => {
      try {
        if (v == null) return def;
        if (typeof v === 'string') return JSON.parse(v);
        if (Array.isArray(v) || typeof v === 'object') return v;
        return def;
      } catch (_) { return def; }
    };

    const elementosPorVista = parse(row.elementos_por_vista, { frente: [] });
    const vistaActual = row.vista_actual || 'frente';
    const elementos = elementosPorVista[vistaActual] || [];

    return res.json({
      id: row.id,
      nombre: row.nombre || '',
      articulo_id: row.articulo_id,
      objeto_id: row.objeto_id,
      articulo_nombre: row.articulo_nombre,
      articulo_imagen: row.articulo_imagen,
      elementos: elementos,
      elementos_por_vista: elementosPorVista,
      vista_actual: vistaActual,
      imagen_preview: row.imagen_preview,
      costo: Number(row.costo || 0),
    });
  } catch (err) {
    console.error('Error obteniendo diseño:', err);
    res.status(500).json({ error: 'Error al obtener el diseño' });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { nombre, objeto_id, elementos_por_vista, vista_actual, imagen_preview, costo } = req.body;
    
    if (!objeto_id) {
      return res.status(400).json({ error: "objeto_id es requerido" });
    }

    const [[obj]] = await db.query(
      `SELECT id FROM objetos WHERE id = ?`,
      [objeto_id]
    );
    
    if (!obj) {
      return res.status(400).json({ error: "Objeto no encontrado" });
    }

    const [result] = await db.query(
      `INSERT INTO disenos (usuario_id, objeto_id, nombre, elementos_por_vista, vista_actual, imagen_preview, costo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, 
        objeto_id, 
        nombre || 'Diseño sin nombre',
        JSON.stringify(elementos_por_vista || {}),
        vista_actual || 'frente',
        imagen_preview || null,
        costo || 0
      ]
    );

    res.json({ 
      id: result.insertId, 
      message: "Diseño guardado exitosamente" 
    });
  } catch (err) {
    console.error("Error guardando diseño:", err);
    res.status(500).json({ error: "Error al guardar diseño" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nombre, elementos_por_vista, vista_actual, imagen_preview, costo } = req.body;

    const [[exists]] = await db.query(
      `SELECT id FROM disenos WHERE id = ? AND usuario_id = ?`,
      [id, req.user.id]
    );
    
    if (!exists) {
      return res.status(404).json({ error: "Diseño no encontrado" });
    }

    await db.query(
      `UPDATE disenos 
       SET nombre = ?, elementos_por_vista = ?, vista_actual = ?, imagen_preview = ?, costo = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        nombre || 'Diseño sin nombre',
        JSON.stringify(elementos_por_vista || {}),
        vista_actual || 'frente',
        imagen_preview || null,
        costo || 0,
        id,
        req.user.id
      ]
    );
    
    res.json({ message: "Diseño actualizado exitosamente" });
  } catch (err) {
    console.error("Error actualizando diseño:", err);
    res.status(500).json({ error: "Error al actualizar diseño" });
  }
});

// DELETE /api/disenos/:id - Eliminar diseño
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[diseno]] = await db.query(
      "SELECT id FROM disenos WHERE id = ? AND usuario_id = ?",
      [id, req.user.id]
    );
    if (!diseno) return res.status(404).json({ error: "Diseño no encontrado" });
    await db.query("DELETE FROM disenos WHERE id = ? AND usuario_id = ?", [id, req.user.id]);
    res.json({ message: "Diseño eliminado exitosamente" });
  } catch (err) {
    console.error("Error eliminando diseño:", err);
    res.status(500).json({ error: "Error al eliminar diseño" });
  }
});

module.exports = router;