const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const dbSelector = require('../middleware/dbSelector');

// Middleware para seleccionar entorno
router.use(dbSelector);

// Obtener categorías visibles según permisos
router.get('/categorias', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener permisos del usuario
    const [permisos] = await req.db.query(`
      SELECT p.id AS permiso_id
      FROM permisos p
      INNER JOIN rol_permisos rp ON p.id = rp.permiso_id
      INNER JOIN usuarios u ON u.rol_id = rp.rol_id
      WHERE u.id = ?
    `, [userId]);

    const permisosIds = permisos.map(p => p.permiso_id);

    if (permisosIds.length === 0) {
      return res.json([]); // No tiene permisos → no ve categorías
    }

    // Obtener categorías que puede ver
    const [categorias] = await req.db.query(`
      SELECT id, nombre
      FROM categorias_mantenedor
      WHERE permiso_id IN (?)
    `, [permisosIds]);

    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener subcategorías visibles según permisos
router.get('/categorias/:id/subcategorias', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const categoriaId = req.params.id;

    // Obtener permisos del usuario
    const [permisos] = await req.db.query(`
      SELECT p.id AS permiso_id
      FROM permisos p
      INNER JOIN rol_permisos rp ON p.id = rp.permiso_id
      INNER JOIN usuarios u ON u.rol_id = rp.rol_id
      WHERE u.id = ?
    `, [userId]);

    const permisosIds = permisos.map(p => p.permiso_id);

    if (permisosIds.length === 0) {
      return res.json([]); // No ve nada
    }

    // Obtener subcategorías que puede ver
    const [subcategorias] = await req.db.query(`
      SELECT id, nombre
      FROM subcategorias_mantenedor
      WHERE categoria_id = ?
      AND permiso_id IN (?)
    `, [categoriaId, permisosIds]);

    res.json(subcategorias);
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
