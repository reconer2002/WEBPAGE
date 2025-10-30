const express = require("express");
const router = express.Router();
const dbSelector = require("../middleware/dbSelector");

router.use(dbSelector);

// Obtener los términos y condiciones más recientes
router.get("/", async (req, res) => {
  try {
    const [rows] = await req.db.query(
      "SELECT titulo, contenido, fecha_actualizacion FROM terminos_condiciones ORDER BY fecha_actualizacion DESC LIMIT 1"
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "No se encontraron términos y condiciones." });

    res.json(rows[0]);
  } catch (err) {
    console.error("Error al obtener términos:", err);
    res.status(500).json({ error: "Error al obtener términos y condiciones." });
  }
});

module.exports = router;