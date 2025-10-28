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
         d.nombre_diseno,
         d.imagen_preview,
         d.costo,
         d.fecha_creacion,
         d.fecha_modificacion,
         o.articulo_id,
         o.precio AS objeto_precio,
         o.existencias AS objeto_stock,
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
       WHERE d.usuario_id = ?
       ORDER BY d.fecha_modificacion DESC`,
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

// GET /api/disenos/:id - Obtener un diseño con todos sus atributos para edición
router.get('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[row]] = await db.query(
      `SELECT d.*, o.articulo_id, a.nombre AS articulo_nombre, a.foto AS articulo_imagen
         FROM disenos d
         JOIN objetos o   ON o.id = d.objeto_id
         JOIN articulos a ON a.id = o.articulo_id
        WHERE d.id = ? AND d.usuario_id = ?
        LIMIT 1`,
      [id, req.user.id]
    );
    if (!row) return res.status(404).json({ error: 'Diseño no encontrado' });

    // Parse helpers
    const parse = (v, def) => {
      try {
        if (v == null) return def;
        if (typeof v === 'string') return JSON.parse(v);
        if (Array.isArray(v) || typeof v === 'object') return v;
        return def;
      } catch (_) { return def; }
    };

    const elementsByView = parse(row.elementos_por_vista, null);

    const imgLoc = parse(row.imagenes_localizacion, []);
    const imgSize = parse(row.imagenes_tamano, []);
    const imgRot = parse(row.imagenes_rotacion, []);
    const imgCap = parse(row.imagenes_capas, []);
    const txtTxt = parse(row.textos, []);
    const txtLoc = parse(row.textos_localizacion, []);
    const txtTam = parse(row.textos_tamano, []);
    const txtCol = parse(row.textos_color, []);
    const txtFnt = parse(row.textos_fuente, []);
    const txtEst = parse(row.textos_estilo, []);
    const txtCap = parse(row.textos_capas, []);
    const imgsArr = parse(row.imagenes, []);

    // Determinar si el primer elemento de imagenes es preview (snapshot)
    const previewLooksLikeDataUrl = typeof imgsArr[0] === 'string' && imgsArr[0].startsWith('data:image');
    const imagesStartIndex = (imgsArr.length === imgLoc.length + 1 && previewLooksLikeDataUrl) ? 1 : 0;

    // Construir elementos de la vista por defecto si no hay elementos_por_vista
    let elements = [];
    if (elementsByView && elementsByView.frente && Array.isArray(elementsByView.frente)) {
      elements = elementsByView.frente;
    } else {
      const tmp = [];
      for (let i = 0; i < imgLoc.length; i++) {
        const url = typeof imgsArr[imagesStartIndex + i] === 'string' ? imgsArr[imagesStartIndex + i] : null;
        const sz = imgSize[i] || {};
        tmp.push({
          id: Date.now() + i,
          type: 'image',
          x: Number(imgLoc[i]?.x) || 0,
          y: Number(imgLoc[i]?.y) || 0,
          url,
          width: Math.round(Number(sz.w) || 0),
          height: Math.round(Number(sz.h) || 0),
          rotation: Math.round(Number(imgRot[i] || 0)) || 0,
          draggable: true,
          _layer: Number(imgCap[i]) || (i + 1),
        });
      }
      for (let j = 0; j < txtTxt.length; j++) {
        const est = txtEst[j] || {};
        const italic = !!est.c; const bold = !!est.n; const underline = !!est.s;
        let fontStyle = 'normal';
        if (italic && bold) fontStyle = 'italic bold';
        else if (italic) fontStyle = 'italic';
        else if (bold) fontStyle = 'bold';
        tmp.push({
          id: Date.now() + 1000 + j,
          type: 'text',
          x: Number(txtLoc[j]?.x) || 0,
          y: Number(txtLoc[j]?.y) || 0,
          text: String(txtTxt[j] || ''),
          fontSize: Number(txtTam[j]) || 16,
          fill: String(txtCol[j] || '#000000'),
          fontFamily: String(txtFnt[j] || 'Arial'),
          fontStyle,
          textDecoration: underline ? 'underline' : 'none',
          rotation: 0,
          scale: 1,
          draggable: true,
          _layer: Number(txtCap[j]) || (j + 1),
        });
      }
      tmp.sort((a, b) => (a._layer || 0) - (b._layer || 0));
      tmp.forEach((e) => delete e._layer);
      elements = tmp;
    }

    return res.json({
      id: row.id,
      nombre: row.nombre_diseno || '',
      articulo_id: row.articulo_id,
      objeto_id: row.objeto_id,
      articulo_nombre: row.articulo_nombre,
      articulo_imagen: row.articulo_imagen,
      elementos: elements,
      elementos_por_vista: elementsByView,
    });
  } catch (err) {
    console.error('Error obteniendo diseño:', err);
    res.status(500).json({ error: 'Error al obtener el diseño' });
  }
});

// GET /api/disenos/:id - Obtener un diseño específico con todos sus elementos
router.get("/:id", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[diseno]] = await db.query(
      `SELECT 
         d.id,
         d.usuario_id,
         d.objeto_id,
         d.nombre_diseno,
         d.elementos_por_vista,
         d.imagen_preview,
         d.costo,
         d.fecha_creacion,
         d.fecha_modificacion,
         o.articulo_id,
         o.precio AS objeto_precio,
         o.existencias,
         a.nombre AS articulo_nombre,
         a.descripcion AS articulo_descripcion,
         a.foto AS articulo_imagen
       FROM disenos d
       JOIN objetos o ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
       WHERE d.id = ? AND d.usuario_id = ?`,
      [id, req.user.id]
    );
    
    if (!diseno) {
      return res.status(404).json({ error: "Diseño no encontrado" });
    }
    
    // MySQL ya parsea automáticamente las columnas JSON, no necesitamos JSON.parse()
    // Solo asegurarnos de que sea un objeto válido
    const response = {
      ...diseno,
      elementos_por_vista: diseno.elementos_por_vista || null,
    };
    
    res.json(response);
  } catch (err) {
    console.error("Error obteniendo diseño:", err);
    res.status(500).json({ error: "Error al obtener diseño" });
  }
});

// POST /api/disenos - Guardar nuevo diseño con todos sus elementos
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

    console.log("✅ Diseño guardado con ID:", result.insertId);
    res.json({ id: result.insertId, message: "Diseño guardado exitosamente" });
  } catch (err) {
    console.error("❌ Error guardando diseño:", err);
    res.status(500).json({ error: "Error al guardar diseño: " + err.message });
  }
});

// PUT /api/disenos/:id - Actualizar diseño existente
router.put("/:id", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { imagen, elementos, variantes } = req.body || {};

    const [[exists]] = await db.query(
      `SELECT id, objeto_id FROM disenos WHERE id = ? AND usuario_id = ?`,
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
    
    console.log("✅ Diseño actualizado:", id);
    res.json({ message: "Diseño actualizado exitosamente" });
  } catch (err) {
    console.error("❌ Error actualizando diseño:", err);
    res.status(500).json({ error: "Error al actualizar diseño: " + err.message });
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