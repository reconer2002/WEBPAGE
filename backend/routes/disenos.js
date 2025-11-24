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
    const { nombre, objeto_id, elementos_por_vista, vista_actual, imagen_preview } = req.body;
    
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
      `INSERT INTO disenos (usuario_id, objeto_id, nombre, elementos_por_vista, vista_actual, imagen_preview)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, 
        objeto_id, 
        nombre || 'Diseño sin nombre',
        JSON.stringify(elementos_por_vista || {}),
        vista_actual || 'frente',
        imagen_preview || null
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
    const { nombre, elementos_por_vista, vista_actual, imagen_preview } = req.body;

    const [[exists]] = await db.query(
      `SELECT id FROM disenos WHERE id = ? AND usuario_id = ?`,
      [id, req.user.id]
    );
    
    if (!exists) {
      return res.status(404).json({ error: "Diseño no encontrado" });
    }

    await db.query(
      `UPDATE disenos 
       SET nombre = ?, elementos_por_vista = ?, vista_actual = ?, imagen_preview = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        nombre || 'Diseño sin nombre',
        JSON.stringify(elementos_por_vista || {}),
        vista_actual || 'frente',
        imagen_preview || null,
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

// GET /api/disenos/public/slider - Obtener diseños del superadmin para el slider (sin auth)
router.get("/public/slider", async (req, res) => {
  try {
    const [rows] = await req.db.query(
      `SELECT 
         d.id,
         d.nombre,
         d.imagen_preview,
         d.costo,
         d.objeto_id,
         o.articulo_id
       FROM disenos d
       JOIN usuarios u ON u.id = d.usuario_id
       JOIN roles r ON r.id = u.rol_id
       JOIN objetos o ON o.id = d.objeto_id
       WHERE r.nombre = 'superadmin' AND d.imagen_preview IS NOT NULL
       ORDER BY d.fecha_modificacion DESC
       LIMIT 10`
    );

    const data = rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      imagen_preview: r.imagen_preview,
      costo: Number(r.costo || 0),
      objeto_id: r.objeto_id,
      articulo_id: r.articulo_id
    }));

    res.json(data);
  } catch (err) {
    console.error("Error obteniendo diseños para slider:", err);
    res.status(500).json({ error: "Error al obtener diseños" });
  }
});

// GET /api/disenos/public/:id - Obtener un diseño del superadmin con todos sus detalles (sin auth)
router.get("/public/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[row]] = await req.db.query(
      `SELECT 
         d.*,
         o.articulo_id,
         o.precio AS objeto_precio,
         o.existencias AS stock,
         o.disenio_base_id,
         a.nombre AS articulo_nombre,
         a.foto AS articulo_imagen,
         a.precio AS articulo_precio,
         u.nombre AS creador_nombre,
         db.frente AS db_frente,
         db.espalda AS db_espalda,
         db.izquierda AS db_izquierda,
         db.derecha AS db_derecha
       FROM disenos d
       JOIN usuarios u ON u.id = d.usuario_id
       JOIN roles r ON r.id = u.rol_id
       JOIN objetos o ON o.id = d.objeto_id
       JOIN articulos a ON a.id = o.articulo_id
       LEFT JOIN disenios_base db ON db.id = o.disenio_base_id
       WHERE d.id = ? AND r.nombre = 'superadmin'
       LIMIT 1`,
      [id]
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

    const elementosPorVista = parse(row.elementos_por_vista, {});
    
    // Construir imagenes_vistas desde las columnas de disenios_base
    // Mapear "espalda" a "detras" para coincidir con el sistema de diseño
    const imagenesVistas = {};
    if (row.db_frente) imagenesVistas.frente = row.db_frente;
    if (row.db_espalda) imagenesVistas.detras = row.db_espalda;  // espalda -> detras
    if (row.db_izquierda) imagenesVistas.izquierda = row.db_izquierda;
    if (row.db_derecha) imagenesVistas.derecha = row.db_derecha;
    
    // Obtener las vistas disponibles desde elementos_por_vista y ordenarlas
    // Solo incluir vistas que realmente existen en elementos_por_vista
    let vistasDisponibles = Object.keys(elementosPorVista);
    
    // Si no hay elementos, no devolver vistas vacías
    if (vistasDisponibles.length === 0) {
      return res.status(404).json({ error: 'Este diseño no tiene vistas configuradas' });
    }
    
    // Obtener la vista actual guardada del diseño
    const vistaActualGuardada = row.vista_actual;
    
    // Si la vista actual guardada existe y está disponible, ponerla primero en el array
    if (vistaActualGuardada && vistasDisponibles.includes(vistaActualGuardada)) {
      // Remover la vista actual del array y ponerla al principio
      vistasDisponibles = vistasDisponibles.filter(v => v !== vistaActualGuardada);
      vistasDisponibles.unshift(vistaActualGuardada);
    } else {
      // Si no hay vista guardada, ordenar según el sistema de diseño: frente, izquierda, derecha, detras
      const ordenVistas = ['frente', 'izquierda', 'derecha', 'detras'];
      vistasDisponibles = vistasDisponibles.sort((a, b) => {
        const indexA = ordenVistas.indexOf(a);
        const indexB = ordenVistas.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
    }
    
    // Si no hay imagenes_vistas definidas, usar la imagen del artículo para todas las vistas
    const imagenesVistasFinal = Object.keys(imagenesVistas).length > 0 
      ? imagenesVistas 
      : vistasDisponibles.reduce((acc, vista) => {
          acc[vista] = row.articulo_imagen;
          return acc;
        }, {});

    return res.json({
      id: row.id,
      nombre: row.nombre || 'Diseño sin nombre',
      articulo_id: row.articulo_id,
      objeto_id: row.objeto_id,
      articulo_nombre: row.articulo_nombre,
      articulo_imagen: row.articulo_imagen,
      elementos_por_vista: elementosPorVista,
      imagenes_vistas: imagenesVistasFinal,
      vistas_disponibles: vistasDisponibles,
      vista_actual: vistaActualGuardada, // Incluir la vista actual guardada
      imagen_preview: row.imagen_preview,
      costo: Number(row.costo || 0),
      precio: Number(row.objeto_precio || row.articulo_precio || 0),
      stock: Number(row.stock || 0),
      creador_nombre: row.creador_nombre
    });
  } catch (err) {
    console.error("Error obteniendo diseño público:", err);
    res.status(500).json({ error: "Error al obtener diseño" });
  }
});

module.exports = router;