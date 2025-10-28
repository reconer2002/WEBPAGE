const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
require('dotenv').config();

const verifyToken = require('../middleware/auth');
const dbSelector = require('../middleware/dbSelector');
const { sendVerificationEmail } = require('./email'); // Asume que email.js está en el mismo directorio

router.use(dbSelector);

async function ensureClienteRol(db) {
  let [[rol]] = await db.query('SELECT id FROM roles WHERE nombre = ? LIMIT 1', ['cliente']);
  if (!rol) {
    await db.query('INSERT INTO roles (nombre) VALUES (?)', ['cliente']);
    [[rol]] = await db.query('SELECT id FROM roles WHERE nombre = ? LIMIT 1', ['cliente']);
  }
  return rol.id;
}

// =======================
// Registro (1. Guarda token, 2. Envía email)
// =======================
router.post('/register', async (req, res) => {
  const {
    username,
    email,
    password,
    nombre_real,
    apellido,
    telefono,
    direccion,
    ciudad,
    region,
    fecha_nacimiento,
  } = req.body || {};

  try {
    if (!username || !email || !password || !nombre_real) {
      return res
        .status(400)
        .json({ error: 'Faltan campos obligatorios: nombre de usuario, nombre real, email o contraseña' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email inválido' });

    const [existing] = await req.db.query('SELECT id FROM usuarios WHERE email = ? OR nombre = ?', [email, username]);
    if (existing.length) return res.status(400).json({ error: 'Nombre de usuario o email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const rolId = await ensureClienteRol(req.db);
    
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Consulta limpia
    const [insUser] = await req.db.query(
      `INSERT INTO usuarios (nombre, email, password, rol_id, verificado, verificacion_token, verificacion_expira) 
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [username, email, hashed, rolId, 0, verificationToken]
    );

    const usuarioId = insUser.insertId;
    const fechaNacimiento = fecha_nacimiento ? new Date(fecha_nacimiento) : null;

    // Consulta limpia
    await req.db.query(
      `INSERT INTO personas (usuario_id, nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuarioId, nombre_real, apellido, telefono, direccion, ciudad, region, fechaNacimiento]
    );

    try {
        await sendVerificationEmail({ to: email, nombre: nombre_real, token: verificationToken });
    } catch (mailErr) {
        console.error('Fallo al enviar email de verificación:', mailErr);
    }
    
    res
      .status(201)
      .json({ message: 'Usuario registrado exitosamente. Por favor verifica tu correo para activar la cuenta.' });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// =======================
// Login (Bloquea si no está verificado)
// =======================
router.post('/login', async (req, res) => {
  const { identificador, password } = req.body;
  try {
    const [rows] = await req.db.query('SELECT id, password, email, verificado, nombre FROM usuarios WHERE email = ? OR nombre = ?', [
      identificador,
      identificador,
    ]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // 🛑 BLOQUEO DE LOGIN
    if (user.verificado === 0) {
        return res.status(403).json({
            error: 'Cuenta no verificada. Revisa tu correo.',
            canResend: true,
            resendEndpoint: '/auth/verify/request',
            email: user.email 
        });
    }

    // Login exitoso
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// =======================
// Obtener perfil (CORREGIDO: Sintaxis SQL Limpia)
// =======================
router.get('/me', verifyToken, async (req, res) => {
  try {
    // 1. Obtener datos de usuario, rol y estado de verificación
    const [[usuario]] = await req.db.query(
      `SELECT u.id, u.nombre AS nombre_usuario, u.email, u.creado_en, u.rol_id, r.nombre AS rol, u.verificado
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
WHERE u.id = ?`, // CONSULTA LIMPIA
      [req.user.id]
    );

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // 2. Obtener datos de la persona
    const [personaRows] = await req.db.query(
      'SELECT nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento FROM personas WHERE usuario_id = ?',
      [req.user.id]
    );
    const persona = personaRows[0] || {}; 

    // 3. Obtener permisos
    const [permisos] = await req.db.query(
      `SELECT p.nombre FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ?`,
      [usuario.rol_id]
    );

    res.json({
      id: usuario.id,
      nombre_usuario: usuario.nombre_usuario,
      email: usuario.email,
      rol: usuario.rol,
      verificado: !!usuario.verificado,
      ...persona, 
      permisos: permisos.map((p) => p.nombre),
    });
  } catch (err) {
    console.error('Error al obtener perfil (GET /me):', err);
    res.status(500).json({ error: 'Error interno al obtener perfil (DB o lógica)', detalle: err.message });
  }
});

// =======================
// Reenvío de correo de verificación
// =======================
router.post('/verify/request', async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) return res.status(400).json({ error: 'Email requerido.' });
        
        const [rows] = await req.db.query('SELECT id, nombre, verificado FROM usuarios WHERE email = ? LIMIT 1', [email]);
        
        if (rows.length === 0 || rows[0].verificado === 1) {
            return res.json({ message: 'Si tu cuenta requiere verificación, se ha enviado un nuevo correo.' });
        }

        const user = rows[0];
        const newToken = crypto.randomBytes(32).toString('hex');

        await req.db.query(
            'UPDATE usuarios SET verificacion_token = ?, verificacion_expira = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?',
            [newToken, user.id]
        );
        
        await sendVerificationEmail({ to: user.email, nombre: user.nombre, token: newToken });

        res.json({ message: 'Se ha enviado un nuevo enlace de verificación a tu correo.' });

    } catch (err) {
        console.error('Error al solicitar reenvío:', err);
        res.status(500).json({ error: 'Error interno del servidor al reenviar correo.' });
    }
});

// =======================
// Verificación (Activa la cuenta)
// =======================
router.post('/verify', async (req, res) => {
    const { token } = req.body;
    try {
        if (!token) return res.status(400).json({ error: 'Token de verificación requerido.' });

        // Consulta limpia
        const [rows] = await req.db.query(
            `SELECT id, email, rol_id FROM usuarios WHERE verificacion_token = ? AND verificado = 0 AND verificacion_expira > NOW()`,
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Token inválido o expirado. Solicita un nuevo enlace.' });
        }

        const user = rows[0];

        // Actualizar el estado de verificación a 1
        await req.db.query(
            'UPDATE usuarios SET verificado = 1, verificacion_token = NULL, verificacion_expira = NULL WHERE id = ?',
            [user.id]
        );

        // Generar token de sesión para loguear inmediatamente
        const loginToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        res.json({ message: 'Cuenta verificada exitosamente. ¡Bienvenido!', token: loginToken });

    } catch (err) {
        console.error('Error al verificar correo:', err);
        res.status(500).json({ error: 'Error al verificar cuenta' });
    }
});


// =======================
// Actualizar perfil
// =======================
router.put('/me', verifyToken, async (req, res) => {
  const { nombre, email, nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento } =
    req.body || {};
  try {
    const [[existe]] = await req.db.query('SELECT id FROM usuarios WHERE id = ?', [req.user.id]);
    if (!existe) return res.status(404).json({ error: 'Usuario no encontrado' });

    await req.db.query('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, req.user.id]);

    const [personaRows] = await req.db.query('SELECT usuario_id FROM personas WHERE usuario_id = ?', [req.user.id]);
    const persona = personaRows[0];

    const fechaNacimiento = fecha_nacimiento ? new Date(fecha_nacimiento) : null;

    if (persona) {
      await req.db.query(
        `UPDATE personas SET nombre_real = ?, apellido = ?, telefono = ?, direccion = ?, ciudad = ?, region = ?, fecha_nacimiento = ?
         WHERE usuario_id = ?`,
        [nombre_real, apellido, telefono, direccion, ciudad, region, fechaNacimiento, req.user.id]
      );
    } else {
      await req.db.query(
        `INSERT INTO personas (usuario_id, nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, nombre_real, apellido, telefono, direccion, ciudad, region, fechaNacimiento]
      );
    }

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Sesión cerrada (cliente debe borrar token)' });
});


module.exports = router;