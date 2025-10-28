const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("./email");
const verifyToken = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");
const router = express.Router();
require("dotenv").config();

// Middleware para selección de BD
router.use(dbSelector);

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body || {};

  try {
    // Permitir registro flexible temporal: si faltan campos, generarlos automáticamente
    let generatedPassword = null;
    let useEmail = email;
    let useNombre = nombre;

    if (!useNombre) {
      useNombre = `user_${Date.now()}`;
    }

    if (!useEmail) {
      // generar email dummy para permitir creación (temporal)
      useEmail = `no-reply+${Date.now()}@example.com`;
    }

    if (!password) {
      // generar contraseña temporal y devolverla en la respuesta para pruebas
      generatedPassword = Math.random().toString(36).slice(-10) + Date.now().toString(36).slice(-4);
      password = generatedPassword;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(useEmail)) return res.status(400).json({ error: "Email inválido" });

    // verificar existencia
    const [existing] = await req.db.query("SELECT id, email, nombre FROM usuarios WHERE email = ? OR nombre = ?", [useEmail, useNombre]);
    if (existing.length > 0) {
      const ex = existing[0];
      if (ex.email === useEmail) return res.status(400).json({ error: "Email ya registrado" });
      if (ex.nombre === useNombre) return res.status(400).json({ error: "Nombre de usuario ya registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // obtener rol cliente
    let [roles] = await req.db.query("SELECT id FROM roles WHERE nombre = ?", ["cliente"]);
    if (roles.length === 0) {
      try {
        await req.db.query("INSERT INTO roles (nombre) VALUES (?)", ["cliente"]);
        [roles] = await req.db.query("SELECT id FROM roles WHERE nombre = ?", ["cliente"]);
      } catch (e) {
        // ignore
      }
      if (roles.length === 0) return res.status(500).json({ error: "Error al obtener rol por defecto" });
    }
    const rolId = roles[0].id;

    const [result] = await req.db.query(
      "INSERT INTO usuarios (nombre, email, password, rol_id) VALUES (?, ?, ?, ?)",
      [useNombre, useEmail, hashedPassword, rolId]
    );

    const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    // generar token de verificación
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      console.log('[Register] Generado verificationToken:', verificationToken);
      // Guardar expiración en la base de datos usando NOW() + INTERVAL 4 MINUTE para evitar desajustes de zona horaria
      try {
        await req.db.query("UPDATE usuarios SET verificacion_token = ?, verificacion_expira = DATE_ADD(NOW(), INTERVAL 4 MINUTE) WHERE id = ?", [verificationToken, result.insertId]);
        try {
          const [nowRow] = await req.db.query('SELECT NOW() AS now');
          console.log('[Register] DB NOW():', nowRow[0]?.now || nowRow[0]);
        } catch (e) {
          /* ignore */
        }
      } catch (dbErr) {
        // Manejar columnas faltantes en la tabla usuarios: consultar INFORMATION_SCHEMA y agregar solo las columnas que falten
        const msg = dbErr && dbErr.message ? dbErr.message : String(dbErr);
        if (msg.includes('Unknown column') || msg.includes('columna desconocida') || msg.includes('ER_BAD_FIELD_ERROR')) {
          console.warn('Columnas de verificación faltantes detectadas. Intentando crear columnas necesarias en tabla usuarios...');
          try {
            // comprobar qué columnas existen
            const needed = ['verificacion_token','verificacion_expira','verificado'];
            const placeholders = needed.map(() => '?').join(',');
            const [existingCols] = await req.db.query(
              `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME IN (${placeholders})`,
              needed
            );
            const have = new Set(existingCols.map(r => r.COLUMN_NAME));
            const toAdd = [];
            if (!have.has('verificacion_token')) toAdd.push("ADD COLUMN verificacion_token VARCHAR(255) NULL");
            if (!have.has('verificacion_expira')) toAdd.push("ADD COLUMN verificacion_expira DATETIME NULL");
            if (!have.has('verificado')) toAdd.push("ADD COLUMN verificado TINYINT(1) DEFAULT 0");
            if (toAdd.length > 0) {
              const alterSql = `ALTER TABLE usuarios ${toAdd.join(', ')}`;
              await req.db.query(alterSql);
            }
            // reintentar actualización usando función de BD para la expiración
            await req.db.query("UPDATE usuarios SET verificacion_token = ?, verificacion_expira = DATE_ADD(NOW(), INTERVAL 4 MINUTE) WHERE id = ?", [verificationToken, result.insertId]);
          } catch (alterErr) {
            console.error('Fallo al crear columnas de verificación o al reintentar la actualización:', alterErr);
          }
        } else {
          console.warn('Error al intentar guardar token de verificación:', dbErr);
        }
      }

      try {
        await sendVerificationEmail({ to: useEmail, nombre: useNombre, token: verificationToken });
        console.log(`[Registro] Correo de verificación enviado a ${useEmail}`);
      } catch (mailErr) {
        console.warn(`[Registro] Fallo al enviar email de verificación a ${useEmail}:`, mailErr && mailErr.message ? mailErr.message : mailErr);
      }
    } catch (e) {
      console.warn('No se pudo generar token de verificación automáticamente:', e && e.message ? e.message : e);
    }

  const respBody = { message: "Usuario registrado exitosamente. Revisa tu correo para verificar la cuenta.", token };
  if (generatedPassword) respBody.generatedPassword = generatedPassword; // devolver contraseña generada temporalmente para pruebas
  res.status(201).json(respBody);
  } catch (err) {
    console.error("Error en registro:", err);
    const debug = process.env.DEBUG_ERRORS === 'true' || process.env.NODE_ENV !== 'production';
    if (debug) return res.status(500).json({ error: 'Error al registrar usuario', message: err.message, stack: err.stack });
    return res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identificador, password } = req.body || {};
  try {
    const [rows] = await req.db.query('SELECT * FROM usuarios WHERE email = ? OR nombre = ?', [identificador, identificador]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });
    // Bloquear login si la cuenta no está verificada
    if (!user.verificado) {
      // Responder rápido indicando que la cuenta no está verificada y que se enviará un correo.
      // Generamos y guardamos el token rápido, pero enviamos el correo de forma asíncrona para no retrasar la respuesta.
      try {
        const token = crypto.randomBytes(32).toString('hex');
        // Guardar token y expiración (esperamos a que se escriba en BD)
        await req.db.query('UPDATE usuarios SET verificacion_token = ?, verificacion_expira = DATE_ADD(NOW(), INTERVAL 4 MINUTE) WHERE id = ?', [token, user.id]);
        // Responder inmediatamente al cliente
        res.status(403).json({
          error: 'Cuenta no verificada. Te hemos enviado un correo de verificación si el email existe en nuestro sistema.',
          canResend: true,
          resendEndpoint: '/api/auth/verify/resend'
        });
        // Enviar correo en background (fire-and-forget). Loguear resultado.
        sendVerificationEmail({ to: user.email, nombre: user.nombre, token })
          .then(() => console.log(`[Login][async-send] Enviado enlace de verificación a ${user.email}`))
          .catch((mailErr) => console.warn('[Login][async-send] Error al enviar email de verificación:', mailErr && mailErr.message ? mailErr.message : mailErr));
        return; // ya respondimos
      } catch (errToken) {
        console.error('[Login] Error al generar/guardar token de verificación automático:', errToken);
        return res.status(500).json({ error: 'Error al procesar verificación de cuenta' });
      }
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
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
      `SELECT u.id, u.nombre, u.email, u.verificado, u.verificacion_expira, u.creado_en, u.rol_id, r.nombre AS rol
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [req.user.id]
    );
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const [permisos] = await req.db.query(
      `SELECT p.nombre FROM permisos p JOIN rol_permisos rp ON p.id = rp.permiso_id WHERE rp.rol_id = ?`,
      [usuario.rol_id]
    );
    res.json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, verificado: !!usuario.verificado, verificacion_expira: usuario.verificacion_expira, creado_en: usuario.creado_en, rol: usuario.rol, permisos: permisos.map(p => p.nombre) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil', detalle: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => res.json({ message: 'Sesión cerrada (cliente debe borrar token)' }));

// PUT /api/auth/me - actualizar perfil (solo nombre y email)
router.put('/me', verifyToken, async (req, res) => {
  const { nombre, email } = req.body || {};
  try {
    const [[actual]] = await req.db.query('SELECT id, nombre, email, verificado FROM usuarios WHERE id = ?', [req.user.id]);
    if (!actual) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!nombre || !email) return res.status(400).json({ error: 'Los campos nombre y email son obligatorios' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email inválido' });
    const [conflictos] = await req.db.query('SELECT id, nombre, email FROM usuarios WHERE (email = ? OR nombre = ?) AND id <> ?', [email, nombre, req.user.id]);
    if (conflictos.length > 0) {
      const conflict = conflictos[0];
      if (conflict.email === email) return res.status(400).json({ error: 'Email ya registrado' });
      if (conflict.nombre === nombre) return res.status(400).json({ error: 'Nombre de usuario ya registrado' });
    }
    const emailCambio = email !== actual.email;
    await req.db.query(`UPDATE usuarios SET nombre = ?, email = ? ${emailCambio ? ', verificado = 0, verificacion_token = NULL, verificacion_expira = NULL' : ''} WHERE id = ?`, [nombre, email, req.user.id]);
    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// POST /api/auth/verify/request - enviar email de verificación
router.post('/verify/request', verifyToken, async (req, res) => {
  try {
    const [[usuario]] = await req.db.query('SELECT id, nombre, email, verificado FROM usuarios WHERE id = ?', [req.user.id]);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.verificado) return res.json({ message: 'Tu cuenta ya está verificada.' });
  const token = crypto.randomBytes(32).toString('hex');
  console.log('[VerifyRequest] Generado token:', token, 'para usuarioId:', req.user.id);
  // Guardar expiración con función de la BD para evitar problemas de timezone
  await req.db.query('UPDATE usuarios SET verificacion_token = ?, verificacion_expira = DATE_ADD(NOW(), INTERVAL 4 MINUTE) WHERE id = ?', [token, req.user.id]);
  try { const [nowRow] = await req.db.query('SELECT NOW() AS now'); console.log('[VerifyRequest] DB NOW():', nowRow[0]?.now || nowRow[0]); } catch(e){}
    let envioOk = true;
    try { await sendVerificationEmail({ to: usuario.email, nombre: usuario.nombre, token }); } catch (mailErr) { envioOk = false; console.warn('No se pudo enviar el correo de verificación:', mailErr && mailErr.message ? mailErr.message : mailErr); }
    res.json({ message: envioOk ? 'Hemos enviado un correo con el enlace de verificación.' : 'Se generó el enlace de verificación, pero el envío de correo no está configurado.' });
  } catch (err) { console.error('Error al solicitar verificación:', err); res.status(500).json({ error: 'Error al solicitar verificación' }); }
});

// POST /api/auth/verify/resend - reenviar verificación por email (no requiere auth)
router.post('/verify/resend', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Debes enviar un email' });
  try {
    const [rows] = await req.db.query('SELECT id, nombre, verificado FROM usuarios WHERE email = ? LIMIT 1', [email]);
    if (!rows || rows.length === 0) {
      // Para evitar enumeración de cuentas, devolver siempre mensaje genérico
      console.log(`[Resend] Solicitud de reenvío para email no registrado: ${email}`);
      return res.json({ message: 'Si la cuenta existe, hemos enviado un correo de verificación.' });
    }
    const usuario = rows[0];
    if (usuario.verificado) return res.json({ message: 'Tu cuenta ya está verificada.' });
  const token = crypto.randomBytes(32).toString('hex');
  console.log('[Resend] Nuevo token generado para', email, token);
  await req.db.query('UPDATE usuarios SET verificacion_token = ?, verificacion_expira = DATE_ADD(NOW(), INTERVAL 4 MINUTE) WHERE id = ?', [token, usuario.id]);
  try { const [nowRow] = await req.db.query('SELECT NOW() AS now'); console.log('[Resend] DB NOW():', nowRow[0]?.now || nowRow[0]); } catch(e){}
    try {
      await sendVerificationEmail({ to: email, nombre: usuario.nombre, token });
      console.log(`[Resend] Enviado enlace de verificación a ${email}`);
      return res.json({ message: 'Hemos enviado un correo con el enlace de verificación.' });
    } catch (mailErr) {
      console.warn('Fallo al enviar email de verificación (resend):', mailErr && mailErr.message ? mailErr.message : mailErr);
      // No exponer fallos internos al cliente; devolver mensaje instructivo
      return res.status(200).json({ message: 'Si la cuenta existe, hemos enviado un correo de verificación.' });
    }
  } catch (err) {
    console.error('Error en resend verificación:', err);
    res.status(500).json({ error: 'Error al reenviar verificación' });
  }
});

// POST /api/auth/verify - verificar cuenta con token
router.post('/verify', async (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Token inválido' });
  try {
    console.log('[Verify] token recibido:', token);
    const [[usuario]] = await req.db.query('SELECT id, email FROM usuarios WHERE verificacion_token = ? AND verificacion_expira > NOW()', [token]);
    if (usuario) {
      console.log('[Verify] usuario encontrado (token válido):', usuario);
      await req.db.query('UPDATE usuarios SET verificado = 1, verificacion_token = NULL, verificacion_expira = NULL WHERE id = ?', [usuario.id]);
      // generar JWT para auto-login en el frontend
      try {
        const jwt = require('jsonwebtoken');
        const tokenJwt = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
        return res.json({ message: 'Tu cuenta ha sido verificada correctamente.', token: tokenJwt });
      } catch (e) {
        console.warn('[Verify] No se pudo generar token JWT para auto-login:', e);
        return res.json({ message: 'Tu cuenta ha sido verificada correctamente.' });
      }
    }

    // Si no se encontró con expiración válida, comprobar si el token existe pero expiró
    const [[usuarioAny]] = await req.db.query('SELECT id, verificacion_expira, verificacion_token FROM usuarios WHERE verificacion_token = ? LIMIT 1', [token]);
    if (usuarioAny) {
      console.log('[Verify] token encontrado pero expirado:', usuarioAny);
      try {
        const [nowRow] = await req.db.query('SELECT NOW() AS now');
        console.log('[Verify] DB NOW():', nowRow[0]?.now || nowRow[0], 'verificacion_expira:', usuarioAny.verificacion_expira);
      } catch (e) {}
      return res.status(400).json({ error: 'Token expirado. Solicita un nuevo enlace de verificación.' });
    }

    console.log('[Verify] token no encontrado en la base de datos:', token);
    return res.status(400).json({ error: 'Token inválido o inexistente. Solicita un nuevo enlace.' });
  } catch (err) { console.error('Error al verificar cuenta:', err); res.status(500).json({ error: 'Error al verificar cuenta' }); }
});

// PUT /api/auth/me/password - cambiar contraseña del usuario autenticado
router.put('/me/password', verifyToken, async (req, res) => {
  const { passwordActual, passwordNueva } = req.body || {};
  if (!passwordActual || !passwordNueva) return res.status(400).json({ error: 'Debes enviar la contraseña actual y la nueva.' });
  if (String(passwordNueva).length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  try {
    const [[usuario]] = await req.db.query('SELECT id, password FROM usuarios WHERE id = ?', [req.user.id]);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(passwordActual, usuario.password); if (!ok) return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
    const misma = await bcrypt.compare(passwordNueva, usuario.password); if (misma) return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la actual.' });
    const hash = await bcrypt.hash(passwordNueva, 10); await req.db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) { console.error('Error al cambiar contraseña:', err); res.status(500).json({ error: 'Error al cambiar contraseña' }); }
});

module.exports = router;