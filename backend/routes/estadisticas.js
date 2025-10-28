const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth"); 
const verifyPermiso = require('../middleware/permisos');
const dbSelector = require('../middleware/dbSelector');

// 💡 Aplica el middleware para seleccionar el entorno de BD
router.use(dbSelector);

/* GET /api/estadisticas */
router.get("/", verifyToken, verifyPermiso('ver_informes'), async (req, res) => {
  try {
    // 1. Obtener la cantidad total de usuarios
    const [usuariosResult] = await req.db.execute(
      'SELECT COUNT(*) AS totalUsuarios FROM usuarios'
    );
    
    const totalUsuarios = usuariosResult[0].totalUsuarios;

    // Construir la respuesta con los datos solicitados
    const estadisticas = {
      totalUsuarios: totalUsuarios,
      // Aquí se agregarían totalPedidos, datos de gráficos, rankings, etc.
    };

    res.json(estadisticas);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

module.exports = router;