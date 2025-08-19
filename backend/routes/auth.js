const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identificador, password } = req.body; //identificador puede ser email o nombre

  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? OR nombre = ?',
      [identificador, identificador]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/me
const verifyToken = require('../middleware/auth');
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [[usuario]] = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.creado_en, u.rol_id, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [permisos] = await pool.query(
      `SELECT p.nombre FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ?`,
      [usuario.rol_id]
    );

    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      creado_en: usuario.creado_en,
      rol: usuario.rol,
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