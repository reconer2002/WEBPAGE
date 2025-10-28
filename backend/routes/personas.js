const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const verifyPermiso = require('../middleware/permisos');
const dbSelector = require('../middleware/dbSelector');

router.use(dbSelector);

// Crear persona (por ejemplo, cuando se crea usuario desde panel admin)
router.post('/', verifyToken, verifyPermiso('moderar_usuarios'), async (req, res) => {
  const { usuario_id, nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento } = req.body;
  try {
    await req.db.query(
      `INSERT INTO personas (usuario_id, nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento]
    );
    res.status(201).json({ message: 'Persona creada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear persona' });
  }
});

// Editar datos personales
router.put('/:usuario_id', verifyToken, async (req, res) => {
  const { nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento } = req.body;
  try {
    await req.db.query(
      `UPDATE personas SET nombre_real = ?, apellido = ?, telefono = ?, direccion = ?, ciudad = ?, region = ?, fecha_nacimiento = ?
       WHERE usuario_id = ?`,
      [nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento, req.params.usuario_id]
    );
    res.json({ message: 'Datos personales actualizados' });
  } catch (err) {
    res.status(500).json({ error: 'Error al editar persona' });
  }
});

module.exports = router;