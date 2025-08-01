const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const permisoMiddleware = require('../middleware/permisos');

//Obtener todos los usuarios (requiere permiso para moderar-usuarios)
router.get('/', authMiddleware, permisoMiddleware('moderar_usuarios'), async (req, res) => {
  try {
    // Consulta con LEFT JOIN para traer roles y fecha creado_en
    const [rows] = await db.execute(`
      SELECT 
        u.id, 
        u.nombre, 
        u.email, 
        u.creado_en, 
        GROUP_CONCAT(r.nombre) AS roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      GROUP BY u.id, u.nombre, u.email, u.creado_en
    `);

    // Convertimos roles string separado por coma a array
    const usuarios = rows.map(u => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      creado_en: u.creado_en,
      roles: u.roles ? u.roles.split(',') : [],
    }));

    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
  }
});

//Obtener usuario por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nombre, email FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al buscar usuario', error: err.message });
  }
});

//Crear usuario
router.post('/', authMiddleware, permisoMiddleware('moderar_usuarios'), async (req, res) => {
  const { nombre, email, password } = req.body;
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash(password, 10);

  try {
    await db.execute('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)', [nombre, email, hash]);
    res.status(201).json({ message: 'Usuario creado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear usuario', error: err.message });
  }
});

//Editar usuario
router.put('/:id', authMiddleware, permisoMiddleware('moderar_usuarios'), async (req, res) => {
  const { nombre, email } = req.body;
  try {
    await db.execute('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, req.params.id]);
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al editar usuario', error: err.message });
  }
});

//Eliminar usuario
router.delete('/:id', authMiddleware, permisoMiddleware('moderar_usuarios'), async (req, res) => {
  try {
    await db.execute('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: err.message });
  }
});

module.exports = router;