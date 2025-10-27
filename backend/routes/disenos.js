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
         a.foto AS articulo_imagen
       FROM disenos d
       JOIN objetos o ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
       WHERE d.usuario_id = ?
       ORDER BY d.fecha_modificacion DESC`,
      [req.user.id]
    );

    // Construir payload compatible con el frontend
    const data = rows.map((r) => ({
      id: r.id,
      usuario_id: r.usuario_id,
      articulo_id: r.articulo_id,
      objeto_id: r.objeto_id,
      nombre: r.nombre_diseno,
      imagen: r.imagen_preview || r.articulo_imagen,
      articulo_nombre: r.articulo_nombre,
      articulo_imagen: r.articulo_imagen,
      costo: Number(r.costo || r.objeto_precio || 0),
      stock: Number(r.objeto_stock || 0),
      fecha_creacion: r.fecha_creacion,
      fecha_modificacion: r.fecha_modificacion,
    }));

    res.json(data);
  } catch (err) {
    console.error("Error obteniendo diseños:", err);
    res.status(500).json({ error: "Error al obtener diseños" });
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
    const { 
      nombre, 
      articulo_id, 
      objeto_id, 
      elementos_por_vista,
      imagen_preview 
    } = req.body || {};
    
    console.log("=== GUARDANDO DISEÑO ===");
    console.log("Nombre:", nombre);
    console.log("Articulo ID:", articulo_id);
    console.log("Objeto ID:", objeto_id);
    console.log("Elementos por vista (tipo):", typeof elementos_por_vista);
    console.log("Tiene imagen preview:", !!imagen_preview);
    
    let finalObjetoId = objeto_id;
    let obj;
    
    // Si viene objeto_id, validarlo
    if (finalObjetoId) {
      const [[objData]] = await db.query(
        `SELECT id, articulo_id, precio FROM objetos WHERE id = ?`,
        [finalObjetoId]
      );
      if (!objData) return res.status(400).json({ error: "El objeto especificado no existe" });
      obj = objData;
      console.log("Objeto validado:", obj.id);
    } else if (articulo_id) {
      // Si solo viene articulo_id, seleccionar objeto por defecto
      const [[objData]] = await db.query(
        `SELECT id, articulo_id, precio FROM objetos WHERE articulo_id = ? ORDER BY existencias DESC, id ASC LIMIT 1`,
        [articulo_id]
      );
      if (!objData) return res.status(400).json({ error: "El artículo no tiene objetos disponibles" });
      obj = objData;
      finalObjetoId = obj.id;
      console.log("Objeto encontrado por artículo:", obj.id);
    } else {
      return res.status(400).json({ error: "articulo_id u objeto_id es requerido" });
    }

    // Preparar elementos para guardar (asegurar que sea JSON válido)
    let elementosPorVistaJson = null;
    
    if (elementos_por_vista) {
      elementosPorVistaJson = typeof elementos_por_vista === 'string' 
        ? elementos_por_vista 
        : JSON.stringify(elementos_por_vista);
    }

    // Calcular costo (usar precio del objeto)
    const costo = Number(obj.precio || 0);

    console.log("Datos a insertar:");
    console.log("- usuario_id:", req.user.id);
    console.log("- objeto_id:", finalObjetoId);
    console.log("- nombre_diseno:", nombre || 'Diseño sin nombre');
    console.log("- tiene elementos_por_vista:", !!elementosPorVistaJson);
    console.log("- tiene imagen_preview:", !!imagen_preview);
    console.log("- costo:", costo);

    const [result] = await db.query(
      `INSERT INTO disenos (
        usuario_id, 
        objeto_id, 
        nombre_diseno, 
        elementos_por_vista,
        imagen_preview,
        costo
      )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, 
        finalObjetoId, 
        nombre || 'Diseño sin nombre',
        elementosPorVistaJson,
        imagen_preview,
        costo
      ]
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
    const { 
      nombre,
      elementos_por_vista,
      imagen_preview 
    } = req.body || {};

    console.log("=== ACTUALIZANDO DISEÑO ===");
    console.log("ID:", id);
    console.log("Nombre:", nombre);

    const [[exists]] = await db.query(
      `SELECT id, objeto_id FROM disenos WHERE id = ? AND usuario_id = ?`,
      [id, req.user.id]
    );
    if (!exists) return res.status(404).json({ error: "Diseño no encontrado" });

    // Preparar campos a actualizar
    const sets = [];
    const vals = [];
    
    if (nombre !== undefined) {
      sets.push('nombre_diseno = ?');
      vals.push(nombre);
    }
    
    if (elementos_por_vista !== undefined) {
      sets.push('elementos_por_vista = ?');
      vals.push(typeof elementos_por_vista === 'string' 
        ? elementos_por_vista 
        : JSON.stringify(elementos_por_vista));
    }
    
    if (imagen_preview !== undefined) {
      sets.push('imagen_preview = ?');
      vals.push(imagen_preview);
    }

    if (!sets.length) {
      return res.json({ message: "Sin cambios" });
    }

    // Agregar fecha de modificación automática (se actualiza sola con ON UPDATE CURRENT_TIMESTAMP)
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
