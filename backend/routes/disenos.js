const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");

// GET /api/disenos - Obtener diseños del usuario
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, p.name as articulo_nombre, p.image as articulo_imagen 
       FROM disenos d 
       JOIN products p ON d.articulo_id = p.id 
       WHERE d.usuario_id = ? 
       ORDER BY d.fecha_modificacion DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error obteniendo diseños:", err);
    res.status(500).json({ error: "Error al obtener diseños" });
  }
});

// POST /api/disenos - Guardar nuevo diseño
router.post("/", auth, async (req, res) => {
  try {
    const { nombre, articulo_id, imagen, elementos, variantes } = req.body;

    if (!nombre || !articulo_id || !imagen) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const [result] = await db.query(
      `INSERT INTO disenos (usuario_id, nombre, articulo_id, imagen, elementos, variantes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        nombre,
        articulo_id,
        imagen,
        JSON.stringify(elementos),
        JSON.stringify(variantes),
      ]
    );

    res.json({
      id: result.insertId,
      message: "Diseño guardado exitosamente",
    });
  } catch (err) {
    console.error("Error guardando diseño:", err);
    res.status(500).json({ error: "Error al guardar diseño" });
  }
});

// PUT /api/disenos/:id - Actualizar diseño
router.put("/:id", auth, async (req, res) => {
  try {
    const { nombre, imagen, elementos, variantes } = req.body;
    const id = parseInt(req.params.id);

    // Verificar propiedad del diseño
    const [[diseno]] = await db.query(
      "SELECT id FROM disenos WHERE id = ? AND usuario_id = ?",
      [id, req.user.id]
    );
    if (!diseno) {
      return res.status(404).json({ error: "Diseño no encontrado" });
    }

    await db.query(
      `UPDATE disenos 
       SET nombre = ?, imagen = ?, elementos = ?, variantes = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        nombre,
        imagen,
        JSON.stringify(elementos),
        JSON.stringify(variantes),
        id,
        req.user.id,
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
    const id = parseInt(req.params.id);

    // Verificar propiedad del diseño
    const [[diseno]] = await db.query(
      "SELECT id FROM disenos WHERE id = ? AND usuario_id = ?",
      [id, req.user.id]
    );
    if (!diseno) {
      return res.status(404).json({ error: "Diseño no encontrado" });
    }

    await db.query("DELETE FROM disenos WHERE id = ? AND usuario_id = ?", [
      id,
      req.user.id,
    ]);
    res.json({ message: "Diseño eliminado exitosamente" });
  } catch (err) {
    console.error("Error eliminando diseño:", err);
    res.status(500).json({ error: "Error al eliminar diseño" });
  }
});

module.exports = router;
