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
         d.nombre_diseno,
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
      const nombre = r.nombre_diseno || `${r.articulo_nombre} #${r.id}`;
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

// POST /api/disenos - Guardar nuevo diseño (adaptado a esquema con objeto_id)
router.post("/", auth, async (req, res) => {
  try {
    const { nombre, articulo_id, imagen, elementos, variantes, imagenes_elementos, elementos_por_vista } = req.body || {};
    if (!articulo_id) return res.status(400).json({ error: "articulo_id es requerido" });

    // Seleccionar objeto por defecto del artículo
    const [[obj]] = await db.query(
      `SELECT id, articulo_id, precio FROM objetos WHERE articulo_id = ? ORDER BY existencias DESC, id ASC LIMIT 1`,
      [articulo_id]
    );
    if (!obj) return res.status(400).json({ error: "El artículo no tiene objetos disponibles" });

    // Mapear datos a columnas normalizadas de disenos
    // Preview de imagen (primera imagen para listado) -> usamos el snapshot del canvas si viene
    let imagenes = null;
    // Consolidar imágenes: snapshot como preview + per-element assets (opcional)
    try {
      const arr = [];
      if (imagen) arr.push(String(imagen));
      const elems = Array.isArray(imagenes_elementos) ? imagenes_elementos.filter(Boolean).map(String) : [];
      arr.push(...elems);
      if (arr.length) imagenes = JSON.stringify(arr);
    } catch (_) {}

    // Parse de elementos entrantes y separación por tipo
    let imgs = [];
    let texts = [];
    try {
      const els = Array.isArray(elementos) ? elementos : JSON.parse(elementos || '[]');
      imgs = els.filter((e) => e && e.type === 'image');
      texts = els.filter((e) => e && e.type === 'text');
    } catch (_) {}

    // Atributos de imágenes
    const img_localizacion = imgs.map((e) => ({ x: Number(e.x) || 0, y: Number(e.y) || 0 }));
    const img_tamano = imgs.map((e) => ({ h: Math.round(Number(e.height) || 0), w: Math.round(Number(e.width) || 0) }));
    const img_rotacion = imgs.map((e) => Math.round(Number(e.rotation) || 0));
    const img_capas = imgs.map((e) => {
      try {
        const all = Array.isArray(elementos) ? elementos : JSON.parse(elementos || '[]');
        const idx = all.findIndex((x) => x && x.id === e.id);
        return idx >= 0 ? idx + 1 : 1;
      } catch {
        return 1;
      }
    });

    // Atributos de textos
    const txt_textos = texts.map((t) => String(t.text || ''));
    const txt_localizacion = texts.map((t) => ({ x: Number(t.x) || 0, y: Number(t.y) || 0 }));
    const txt_tamano = texts.map((t) => Number(t.fontSize) || 0);
    const txt_color = texts.map((t) => String(t.fill || '#000000'));
    const txt_fuente = texts.map((t) => String(t.fontFamily || 'Arial'));
    const txt_estilo = texts.map((t) => {
      const style = String(t.fontStyle || 'normal').toLowerCase();
      const italic = style.includes('italic');
      // No tenemos fontWeight/textDecoration, inferimos básico
      const bold = style.includes('bold');
      const underline = String(t.textDecoration || '').toLowerCase().includes('underline');
      return { c: italic, n: bold, s: underline };
    });
    const txt_capas = texts.map((t) => {
      try {
        const all = Array.isArray(elementos) ? elementos : JSON.parse(elementos || '[]');
        const idx = all.findIndex((x) => x && x.id === t.id);
        return idx >= 0 ? idx + 1 : 1;
      } catch {
        return 1;
      }
    });

    // Costo
    let costo = null;
    try {
      const v = typeof variantes === 'string' ? JSON.parse(variantes) : (variantes || {});
      if (v && v.precio != null) costo = Number(v.precio);
    } catch (_) {}
    if (costo == null) costo = Number(obj.precio || 0);

    const elementosPorVistaStr = elementos_por_vista ? JSON.stringify(elementos_por_vista) : null;

    const [result] = await db.query(
      `INSERT INTO disenos (
         usuario_id, objeto_id, nombre_diseno,
         imagenes, imagenes_localizacion, imagenes_tamano, imagenes_rotacion, imagenes_capas,
         textos, textos_localizacion, textos_tamano, textos_color, textos_fuente, textos_estilo, textos_capas,
         elementos_por_vista, costo
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id, obj.id, nombre || null,
        imagenes,
        img_localizacion.length ? JSON.stringify(img_localizacion) : null,
        img_tamano.length ? JSON.stringify(img_tamano) : null,
        img_rotacion.length ? JSON.stringify(img_rotacion) : null,
        img_capas.length ? JSON.stringify(img_capas) : null,
        txt_textos.length ? JSON.stringify(txt_textos) : null,
        txt_localizacion.length ? JSON.stringify(txt_localizacion) : null,
        txt_tamano.length ? JSON.stringify(txt_tamano) : null,
        txt_color.length ? JSON.stringify(txt_color) : null,
        txt_fuente.length ? JSON.stringify(txt_fuente) : null,
        txt_estilo.length ? JSON.stringify(txt_estilo) : null,
        txt_capas.length ? JSON.stringify(txt_capas) : null,
        elementosPorVistaStr,
        costo,
      ]
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
    const { imagen, elementos, variantes, nombre, imagenes_elementos, elementos_por_vista } = req.body || {};

    const [[exists]] = await db.query(
      `SELECT id FROM disenos WHERE id = ? AND usuario_id = ?`,
      [id, req.user.id]
    );
    if (!exists) return res.status(404).json({ error: "Diseño no encontrado" });

    let imagenes = null;
    // Consolidar imágenes si nos envían snapshot y/o assets por elemento
    try {
      const arr = [];
      if (imagen) arr.push(String(imagen));
      const elems = Array.isArray(imagenes_elementos) ? imagenes_elementos.filter(Boolean).map(String) : [];
      arr.push(...elems);
      if (arr.length) imagenes = JSON.stringify(arr);
    } catch (_) {}

    // Recalcular atributos si vienen elementos
    let img_localizacion = null, img_tamano = null, img_rotacion = null, img_capas = null;
    let txt_textos = null, txt_localizacion = null, txt_tamano = null, txt_color = null, txt_fuente = null, txt_estilo = null, txt_capas = null;
    try {
      const els = Array.isArray(elementos) ? elementos : JSON.parse(elementos || '[]');
      if (Array.isArray(els) && els.length) {
        const imgs = els.filter((e) => e && e.type === 'image');
        const texts = els.filter((e) => e && e.type === 'text');
        const iloc = imgs.map((e) => ({ x: Number(e.x) || 0, y: Number(e.y) || 0 }));
        const itam = imgs.map((e) => ({ h: Math.round(Number(e.height) || 0), w: Math.round(Number(e.width) || 0) }));
        const irot = imgs.map((e) => Math.round(Number(e.rotation) || 0));
        const icap = imgs.map((e) => {
          const idx = els.findIndex((x) => x && x.id === e.id);
          return idx >= 0 ? idx + 1 : 1;
        });
        const ttxt = texts.map((t) => String(t.text || ''));
        const tloc = texts.map((t) => ({ x: Number(t.x) || 0, y: Number(t.y) || 0 }));
        const ttam = texts.map((t) => Number(t.fontSize) || 0);
        const tcol = texts.map((t) => String(t.fill || '#000000'));
        const tfnt = texts.map((t) => String(t.fontFamily || 'Arial'));
        const test = texts.map((t) => {
          const style = String(t.fontStyle || 'normal').toLowerCase();
          const italic = style.includes('italic');
          const bold = style.includes('bold');
          const underline = String(t.textDecoration || '').toLowerCase().includes('underline');
          return { c: italic, n: bold, s: underline };
        });
        const tcap = texts.map((t) => {
          const idx = els.findIndex((x) => x && x.id === t.id);
          return idx >= 0 ? idx + 1 : 1;
        });
        img_localizacion = iloc.length ? JSON.stringify(iloc) : null;
        img_tamano = itam.length ? JSON.stringify(itam) : null;
        img_rotacion = irot.length ? JSON.stringify(irot) : null;
        img_capas = icap.length ? JSON.stringify(icap) : null;
        txt_textos = ttxt.length ? JSON.stringify(ttxt) : null;
        txt_localizacion = tloc.length ? JSON.stringify(tloc) : null;
        txt_tamano = ttam.length ? JSON.stringify(ttam) : null;
        txt_color = tcol.length ? JSON.stringify(tcol) : null;
        txt_fuente = tfnt.length ? JSON.stringify(tfnt) : null;
        txt_estilo = test.length ? JSON.stringify(test) : null;
        txt_capas = tcap.length ? JSON.stringify(tcap) : null;
      }
    } catch (_) {}

    let costo = null;
    try {
      const v = typeof variantes === 'string' ? JSON.parse(variantes) : (variantes || {});
      if (v && v.precio != null) costo = Number(v.precio);
    } catch (_) {}

    const sets = [];
    const vals = [];
    if (imagenes !== null) { sets.push('imagenes = ?'); vals.push(imagenes); }
    if (costo !== null)    { sets.push('costo = ?'); vals.push(costo); }
    if (typeof nombre === 'string') { sets.push('nombre_diseno = ?'); vals.push(nombre || null); }
    if (img_localizacion !== null) { sets.push('imagenes_localizacion = ?'); vals.push(img_localizacion); }
    if (img_tamano !== null)       { sets.push('imagenes_tamano = ?'); vals.push(img_tamano); }
    if (img_rotacion !== null)     { sets.push('imagenes_rotacion = ?'); vals.push(img_rotacion); }
    if (img_capas !== null)        { sets.push('imagenes_capas = ?'); vals.push(img_capas); }
    if (txt_textos !== null)       { sets.push('textos = ?'); vals.push(txt_textos); }
    if (txt_localizacion !== null) { sets.push('textos_localizacion = ?'); vals.push(txt_localizacion); }
    if (txt_tamano !== null)       { sets.push('textos_tamano = ?'); vals.push(txt_tamano); }
    if (txt_color !== null)        { sets.push('textos_color = ?'); vals.push(txt_color); }
    if (txt_fuente !== null)       { sets.push('textos_fuente = ?'); vals.push(txt_fuente); }
    if (txt_estilo !== null)       { sets.push('textos_estilo = ?'); vals.push(txt_estilo); }
    if (txt_capas !== null)        { sets.push('textos_capas = ?'); vals.push(txt_capas); }
    if (typeof elementos_por_vista !== 'undefined') {
      sets.push('elementos_por_vista = ?');
      vals.push(elementos_por_vista ? JSON.stringify(elementos_por_vista) : null);
    }
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
