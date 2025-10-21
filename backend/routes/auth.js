const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

const verifyToken = require('../middleware/auth');
const dbSelector = require('../middleware/dbSelector');

// --- Middleware para entornos ---
router.use(dbSelector);

// Utilidad: obtener rol "cliente" o crearlo
async function ensureClienteRol(db) {
  let [[rol]] = await db.query('SELECT id FROM roles WHERE nombre = ? LIMIT 1', ['cliente']);
  if (!rol) {
    await db.query('INSERT INTO roles (nombre) VALUES (?)', ['cliente']);
    [[rol]] = await db.query('SELECT id FROM roles WHERE nombre = ? LIMIT 1', ['cliente']);
  }
  return rol.id;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { nombre, email, password, apellido, direccion, telefono, ciudad, region } = req.body || {};

  try {
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Los campos nombre, email y contraseña son requeridos' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const [existing] = await req.db.query('SELECT id, email, nombre FROM usuarios WHERE email = ? OR nombre = ?', [email, nombre]);
    if (existing.length) {
      const e = existing[0];
      return res.status(400).json({ error: e.email === email ? 'Email ya registrado' : 'Nombre de usuario ya registrado' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const rolId = await ensureClienteRol(req.db);

    const [ins] = await req.db.query('INSERT INTO usuarios (nombre, email, password, rol_id) VALUES (?, ?, ?, ?)', [nombre, email, hashed, rolId]);

    // Guardar datos extendidos si existen las columnas (idempotente)
    try {
      await req.db.query(
        'UPDATE usuarios SET telefono = ?, ciudad = ?, region = ?, apellido = ?, direccion = ? WHERE id = ?',
        [telefono || null, ciudad || null, region || null, apellido || null, direccion || null, ins.insertId]
      );
    } catch (_) { /* columnas pueden no existir; ignorar */ }

    const token = jwt.sign({ id: ins.insertId, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.status(201).json({ message: 'Usuario registrado exitosamente', token });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identificador, password } = req.body;

  try {
    const [rows] = await req.db.query(
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
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [[usuario]] = await req.db.query(
      `SELECT u.id, u.nombre, u.email, u.creado_en, u.rol_id, r.nombre AS rol,
              u.telefono, u.ciudad, u.region, u.apellido, u.direccion
         FROM usuarios u
         JOIN roles r ON u.rol_id = r.id
        WHERE u.id = ?`,
      [req.user.id]
    );

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [permisos] = await req.db.query(
      `SELECT p.nombre FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ?`,
      [usuario.rol_id]
    );

    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      apellido: usuario.apellido || '',
      telefono: usuario.telefono || '',
      direccion: usuario.direccion || '',
      ciudad: usuario.ciudad || '',
      region: usuario.region || '',
      creado_en: usuario.creado_en,
      rol: usuario.rol,
      permisos: permisos.map(p => p.nombre),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil', detalle: err.message });
  }
});

// PUT /api/auth/me - actualizar perfil
router.put('/me', verifyToken, async (req, res) => {
  const { nombre, apellido, email, telefono, direccion, ciudad, region } = req.body || {};
  try {
    const [[actual]] = await req.db.query('SELECT id FROM usuarios WHERE id = ?', [req.user.id]);
    if (!actual) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (!nombre || !email) {
      return res.status(400).json({ error: 'Los campos nombre y email son obligatorios' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email inválido' });

    const [conflictos] = await req.db.query('SELECT id FROM usuarios WHERE (email = ? OR nombre = ?) AND id <> ?', [email, nombre, req.user.id]);
    if (conflictos.length) return res.status(400).json({ error: 'Email o nombre ya registrado por otro usuario' });

    await req.db.query(
      `UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, direccion = ?, ciudad = ?, region = ?, apellido = ? WHERE id = ?`,
      [nombre, email, telefono || null, direccion || null, ciudad || null, region || null, apellido || null, req.user.id]
    );

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesión cerrada (cliente debe borrar token)' });
});

module.exports = router;
