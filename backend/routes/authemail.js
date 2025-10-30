const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
require('dotenv').config();

const verifyToken = require('../middleware/auth');
const dbSelector = require('../middleware/dbSelector');
const { sendVerificationEmail } = require('./email');

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
// Registro
// =======================
router.post('/register', async (req, res) => {
  const {
    nombre,
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
    if (!nombre || !email || !password || !nombre_real) {
      return res
        .status(400)
        .json({ error: 'Faltan campos obligatorios: nombre de usuario, nombre real, email o contraseña' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email inválido' });

    const [existing] = await req.db.query('SELECT id FROM usuarios WHERE email = ? OR nombre = ?', [email, nombre]);
    if (existing.length) return res.status(400).json({ error: 'Nombre de usuario o email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const rolId = await ensureClienteRol(req.db);

    const [insUser] = await req.db.query(
      'INSERT INTO usuarios (nombre, email, password, rol_id, verificado) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hashed, rolId, 0]
    );

    const usuarioId = insUser.insertId;
    const fechaNacimiento = fecha_nacimiento ? new Date(fecha_nacimiento) : null;

    await req.db.query(
      `INSERT INTO personas (usuario_id, nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuarioId, nombre_real, apellido, telefono, direccion, ciudad, region, fechaNacimiento]
    );

    // Generar y enviar token de verificación
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      await req.db.query(
        'UPDATE usuarios SET verificacion_token = ?, verificacion_expira = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?',
        [verificationToken, usuarioId]
      );

      try {
        await sendVerificationEmail({ to: email, nombre: nombre, token: verificationToken });
        console.log(`[Registro] Correo de verificación enviado a ${email}`);
      } catch (mailErr) {
        console.warn(`[Registro] Error al enviar email de verificación:`, mailErr);
      }
    } catch (e) {
      console.warn('Error al generar token de verificación:', e);
    }

    res
      .status(201)
      .json({ 
        success: true,
        message: 'Usuario registrado exitosamente. Por favor verifica tu correo para activar la cuenta.' 
      });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// =======================
// Login
// =======================
router.post('/login', async (req, res) => {
  const { identificador, password } = req.body;
  try {
    const [rows] = await req.db.query('SELECT * FROM usuarios WHERE email = ? OR nombre = ?', [
      identificador,
      identificador,
    ]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // ========================================
    // BLOQUEAR LOGIN SI NO ESTÁ VERIFICADO
    // ========================================
    if (!user.verificado) {
      try {
        const token = crypto.randomBytes(32).toString('hex');
        await req.db.query(
          'UPDATE usuarios SET verificacion_token = ?, verificacion_expira = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?',
          [token, user.id]
        );

        res.status(403).json({
          error: 'Cuenta no verificada. Te hemos enviado un correo de verificación.',
          canResend: true,
          resendEndpoint: '/api/auth/verify/resend'
        });

        // Enviar correo en background
        sendVerificationEmail({ to: user.email, nombre: user.nombre, token })
          .then(() => console.log(`[Login] Enviado enlace de verificación a ${user.email}`))
          .catch((mailErr) => console.warn('[Login] Error al enviar email:', mailErr && mailErr.message ? mailErr.message : mailErr));

        return;
      } catch (errToken) {
        console.error('[Login] Error al generar token de verificación:', errToken);
        return res.status(500).json({ error: 'Error al procesar verificación de cuenta' });
      }
    }

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
// Obtener perfil
// =======================
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [[usuario]] = await req.db.query(
      `SELECT u.id, u.nombre AS nombre_usuario, u.email, u.creado_en, u.rol_id, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [[persona]] = await req.db.query(
      'SELECT nombre_real, apellido, telefono, direccion, ciudad, region, fecha_nacimiento FROM personas WHERE usuario_id = ?',
      [req.user.id]
    );

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
      ...persona,
      permisos: permisos.map((p) => p.nombre),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil' });
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

    const [[persona]] = await req.db.query('SELECT usuario_id FROM personas WHERE usuario_id = ?', [req.user.id]);

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

// =======================
// Verificar email
// =======================
router.post('/verify', async (req, res) => {
  const { token } = req.body || {};

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token inválido' });
  }

  try {
    const [[usuario]] = await req.db.query(
      'SELECT id, email FROM usuarios WHERE verificacion_token = ? AND verificacion_expira > NOW()',
      [token]
    );

    if (usuario) {
      await req.db.query(
        'UPDATE usuarios SET verificado = 1, verificacion_token = NULL, verificacion_expira = NULL WHERE id = ?',
        [usuario.id]
      );

      const tokenJwt = jwt.sign(
        { id: usuario.id, email: usuario.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        message: 'Tu cuenta ha sido verificada correctamente.',
        token: tokenJwt
      });
    }

    // Verificar si el token existe pero expiró
    const [[usuarioAny]] = await req.db.query(
      'SELECT id FROM usuarios WHERE verificacion_token = ? LIMIT 1',
      [token]
    );

    if (usuarioAny) {
      return res.status(400).json({
        error: 'Token expirado. Solicita un nuevo enlace de verificación.'
      });
    }

    return res.status(400).json({
      error: 'Token inválido o inexistente. Solicita un nuevo enlace.'
    });
  } catch (err) {
    console.error('Error al verificar cuenta:', err);
    res.status(500).json({ error: 'Error al verificar cuenta' });
  }
});

// =======================
// Reenviar verificación
// =======================
router.post('/verify/resend', async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Debes enviar un email' });
  }

  try {
    const [rows] = await req.db.query(
      'SELECT id, nombre, verificado FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.json({ message: 'Si la cuenta existe, hemos enviado un correo de verificación.' });
    }

    const usuario = rows[0];

    if (usuario.verificado) {
      return res.json({ message: 'Tu cuenta ya está verificada.' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await req.db.query(
      'UPDATE usuarios SET verificacion_token = ?, verificacion_expira = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?',
      [token, usuario.id]
    );

    try {
      await sendVerificationEmail({ to: email, nombre: usuario.nombre, token });
      console.log(`[Resend] Enviado enlace de verificación a ${email}`);
      return res.json({ message: 'Hemos enviado un correo con el enlace de verificación.' });
    } catch (mailErr) {
      console.warn('Error al enviar email de verificación:', mailErr);
      return res.json({ message: 'Si la cuenta existe, hemos enviado un correo de verificación.' });
    }
  } catch (err) {
    console.error('Error en resend verificación:', err);
    res.status(500).json({ error: 'Error al reenviar verificación' });
  }
});

module.exports = router;
