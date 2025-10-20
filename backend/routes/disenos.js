const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");

const firstImageExpr = `JSON_UNQUOTE(JSON_EXTRACT(d.imagenes, '$[0]'))`;

// GET /api/disenos - Obtener diseños del usuario (mapeando al formato esperado por el frontend)
router.get("/", auth, async (req, res) => {
  try {
    // Deduplicar por combinación (objeto_id, imagenes, textos) para evitar clones del carrito
    const [rows] = await db.query(
      `SELECT 
         d.id,
         d.usuario_id,
         d.objeto_id,
         o.articulo_id,
         a.nombre AS articulo_nombre,
         a.foto   AS articulo_imagen,
         ${firstImageExpr} AS imagen,
         COALESCE(o.precio, a.precio) AS precio,
         d.costo
       FROM (
         SELECT MAX(id) AS id
           FROM disenos 
          WHERE usuario_id = ?
            AND (imagenes IS NOT NULL OR textos IS NOT NULL)
          GROUP BY objeto_id, CAST(imagenes AS CHAR), CAST(textos AS CHAR)
       ) u
       JOIN disenos d   ON d.id = u.id
       JOIN objetos o   ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
       ORDER BY d.id DESC`,
      [req.user.id]
    );

    // Construir payload compatible con el frontend
    const data = rows.map((r) => {
      const elementos = [
        // Intento de derivar un texto principal, si no hay, usar nombre de artículo
      ];
      const variantes = { vista: 'frente', cantidad: 1, precio: Number(r.precio || 0) };
      const nombre = `${r.articulo_nombre} #${r.id}`;
      return {
        id: r.id,
        usuario_id: r.usuario_id,
        articulo_id: r.articulo_id,
        nombre,
        imagen: r.imagen || r.articulo_imagen || null,
        elementos: JSON.stringify(elementos),
        variantes: JSON.stringify(variantes),
        articulo_nombre: r.articulo_nombre,
        articulo_imagen: r.articulo_imagen,
      };
    });

    res.json(data);
  } catch (err) {
    console.error("Error obteniendo diseños:", err);
    res.status(500).json({ error: "Error al obtener diseños" });
  }
});

// POST /api/disenos - Guardar nuevo diseño (adaptado a esquema con objeto_id)
router.post("/", auth, async (req, res) => {
  try {
    const { nombre, articulo_id, imagen, elementos, variantes } = req.body || {};
    if (!articulo_id) return res.status(400).json({ error: "articulo_id es requerido" });

    // Seleccionar objeto por defecto del artículo
    const [[obj]] = await db.query(
      `SELECT id, articulo_id, precio FROM objetos WHERE articulo_id = ? ORDER BY existencias DESC, id ASC LIMIT 1`,
      [articulo_id]
    );
    if (!obj) return res.status(400).json({ error: "El artículo no tiene objetos disponibles" });

    // Mapear datos
    let imagenes = null;
    if (imagen) imagenes = JSON.stringify([String(imagen)]);

    // Derivar textos desde elementos (si vienen)
    let textos = null;
    try {
      const els = Array.isArray(elementos) ? elementos : JSON.parse(elementos || '[]');
      const onlyText = els.filter((e) => e && e.type === 'text').map((t) => String(t.text || '')).filter(Boolean);
      if (onlyText.length) textos = JSON.stringify(onlyText);
    } catch (_) {}

    // Costo
    let costo = null;
    try {
      const v = typeof variantes === 'string' ? JSON.parse(variantes) : (variantes || {});
      if (v && v.precio != null) costo = Number(v.precio);
    } catch (_) {}
    if (costo == null) costo = Number(obj.precio || 0);

    const [result] = await db.query(
      `INSERT INTO disenos (usuario_id, objeto_id, imagenes, textos, costo)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, obj.id, imagenes, textos, costo]
    );

    res.json({ id: result.insertId, message: "Diseño guardado exitosamente" });
  } catch (err) {
    console.error("Error guardando diseño:", err);
    res.status(500).json({ error: "Error al guardar diseño" });
  }
});

// PUT /api/disenos/:id - Actualizar diseño
router.put("/:id", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { imagen, elementos, variantes } = req.body || {};

    const [[exists]] = await db.query(
      `SELECT id FROM disenos WHERE id = ? AND usuario_id = ?`,
      [id, req.user.id]
    );
    if (!exists) return res.status(404).json({ error: "Diseño no encontrado" });

    let imagenes = null;
    if (imagen) imagenes = JSON.stringify([String(imagen)]);

    let textos = null;
    try {
      const els = Array.isArray(elementos) ? elementos : JSON.parse(elementos || '[]');
      const onlyText = els.filter((e) => e && e.type === 'text').map((t) => String(t.text || '')).filter(Boolean);
      if (onlyText.length) textos = JSON.stringify(onlyText);
    } catch (_) {}

    let costo = null;
    try {
      const v = typeof variantes === 'string' ? JSON.parse(variantes) : (variantes || {});
      if (v && v.precio != null) costo = Number(v.precio);
    } catch (_) {}

    const sets = [];
    const vals = [];
    if (imagenes !== null) { sets.push('imagenes = ?'); vals.push(imagenes); }
    if (textos !== null)   { sets.push('textos = ?'); vals.push(textos); }
    if (costo !== null)    { sets.push('costo = ?'); vals.push(costo); }
    if (!sets.length) return res.json({ message: "Sin cambios" });
    vals.push(id, req.user.id);
    await db.query(
      `UPDATE disenos SET ${sets.join(', ')} WHERE id = ? AND usuario_id = ?`,
      vals
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
