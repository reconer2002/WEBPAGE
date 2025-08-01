const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/me
const verifyToken = require('../middleware/auth');
router.get('/me', verifyToken, async (req, res) => {
  try {
    // 1. Obtener datos del usuario, incluyendo fecha de creación
    const [[usuario]] = await pool.query(
      'SELECT id, nombre, email, creado_en FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // 2. Obtener roles
    const [roles] = await pool.query(
      `SELECT r.nombre FROM roles r
       JOIN usuario_roles ur ON r.id = ur.rol_id
       WHERE ur.usuario_id = ?`,
      [usuario.id]
    );

    // 3. Obtener permisos
    const [permisos] = await pool.query(
      `SELECT DISTINCT p.nombre FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       JOIN usuario_roles ur ON rp.rol_id = ur.rol_id
       WHERE ur.usuario_id = ?`,
      [usuario.id]
    );

    // 4. Enviar respuesta con usuario, fecha, roles y permisos
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      creado_en: usuario.creado_en,
      roles: roles.map(r => r.nombre),
      permisos: permisos.map(p => p.nombre),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil', detalle: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesión cerrada (cliente debe borrar token)' });
});

module.exports = router;