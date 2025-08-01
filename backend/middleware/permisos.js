const db = require('../db');

module.exports = function (permisoRequerido) {
  return async (req, res, next) => {
    const userId = req.user.id;

    try {
      const [rows] = await db.execute(`
        SELECT p.nombre FROM permisos p
        JOIN rol_permisos rp ON rp.permiso_id = p.id
        JOIN usuario_roles ur ON ur.rol_id = rp.rol_id
        WHERE ur.usuario_id = ?
      `, [userId]);

      const permisos = rows.map(row => row.nombre);
      if (!permisos.includes(permisoRequerido)) {
        return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
      }

      next();
    } catch (err) {
      res.status(500).json({ message: 'Error al validar permisos', error: err.message });
    }
  };
};