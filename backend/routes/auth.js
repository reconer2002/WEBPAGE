const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/email");
const verifyToken = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");
const router = express.Router();
require("dotenv").config();

// Middleware para selección de BD
router.use(dbSelector);

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const {
    nombre,
    email,
    password,
    apellido,
    telefono,
    direccion,
    ciudad,
    region,
  } = req.body;

  try {
    // Validar campos requeridos (teléfono ya no es obligatorio)
    if (!nombre || !email || !password || !apellido) {
      return res
        .status(400)
        .json({
          error:
            "Los campos nombre, apellido, email y contraseña son requeridos",
        });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Verificar si el usuario ya existe
    const [existingUsers] = await req.db.query(
      "SELECT * FROM usuarios WHERE email = ? OR nombre = ?",
      [email, nombre]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email ya registrado" });
      }
      if (existingUser.nombre === nombre) {
        return res
          .status(400)
          .json({ error: "Nombre de usuario ya registrado" });
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Obtener el rol por defecto (cliente)
    let [roles] = await req.db.query("SELECT id FROM roles WHERE nombre = ?", [
      "cliente",
    ]);
    if (roles.length === 0) {
      // Intentar crear rol por defecto si no existe
      try {
        await req.db.query("INSERT INTO roles (nombre) VALUES (?)", ["cliente"]);
        [roles] = await req.db.query("SELECT id FROM roles WHERE nombre = ?", [
          "cliente",
        ]);
      } catch (e) {
        // Si falla la creación, responder con error claro
      }
      if (roles.length === 0) {
        return res
          .status(500)
          .json({ error: "Error al obtener rol por defecto" });
      }
    }
    const rolId = roles[0].id;

    // Insertar nuevo usuario
    const [result] = await req.db.query(
      "INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion, ciudad, region, rol_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nombre,
        apellido,
        email,
        hashedPassword,
        telefono || null,
        direccion || null,
        ciudad || null,
        region || null,
        rolId,
      ]
    );

    // Generar token
    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      token,
    });
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { identificador, password } = req.body; //identificador puede ser email o nombre

  try {
    const [rows] = await req.db.query(
      "SELECT * FROM usuarios WHERE email = ? OR nombre = ?",
      [identificador, identificador]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: "Usuario no encontrado" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [[usuario]] = await req.db.query(
      `SELECT 
         u.id,
         u.nombre,
         u.apellido,
         u.email,
         u.telefono,
         u.direccion,
         u.ciudad,
         u.region,
         u.verificado,
         u.verificacion_expira,
         u.creado_en,
         u.rol_id,
         r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const [permisos] = await req.db.query(
      `SELECT p.nombre FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ?`,
      [usuario.rol_id]
    );

    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      ciudad: usuario.ciudad,
      region: usuario.region,
      verificado: !!usuario.verificado,
      verificacion_expira: usuario.verificacion_expira,
      creado_en: usuario.creado_en,
      rol: usuario.rol,
      permisos: permisos.map((p) => p.nombre),
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error al obtener perfil", detalle: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({ message: "Sesión cerrada (cliente debe borrar token)" });
});

// PUT /api/auth/me - actualizar perfil del usuario autenticado
router.put("/me", verifyToken, async (req, res) => {
  const { nombre, apellido, email, telefono, direccion, ciudad, region } =
    req.body || {};

  try {
    // Obtener usuario actual
    const [[actual]] = await req.db.query(
      "SELECT id, nombre, email, verificado FROM usuarios WHERE id = ?",
      [req.user.id]
    );
    if (!actual) return res.status(404).json({ error: "Usuario no encontrado" });

    // Validaciones básicas (teléfono ya no es obligatorio)
    if (!nombre || !apellido || !email) {
      return res.status(400).json({
        error: "Los campos nombre, apellido y email son obligatorios",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Verificar unicidad de email y nombre si cambiaron
    const [conflictos] = await req.db.query(
      "SELECT id, nombre, email FROM usuarios WHERE (email = ? OR nombre = ?) AND id <> ?",
      [email, nombre, req.user.id]
    );
    if (conflictos.length > 0) {
      const conflict = conflictos[0];
      if (conflict.email === email) {
        return res.status(400).json({ error: "Email ya registrado" });
      }
      if (conflict.nombre === nombre) {
        return res
          .status(400)
          .json({ error: "Nombre de usuario ya registrado" });
      }
    }

    // Determinar si cambió el email
    const emailCambio = email !== actual.email;

    // Construir actualización
    await req.db.query(
      `UPDATE usuarios
       SET nombre = ?, apellido = ?, email = ?, telefono = ?, direccion = ?, ciudad = ?, region = ?
         ${emailCambio ? ", verificado = 0, verificacion_token = NULL, verificacion_expira = NULL" : ""}
       WHERE id = ?`,
      [
        nombre,
        apellido,
        email,
        telefono || null,
        direccion || null,
        ciudad || null,
        region || null,
        req.user.id,
      ]
    );

    res.json({ message: "Perfil actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

// POST /api/auth/verify/request - enviar email de verificación
router.post("/verify/request", verifyToken, async (req, res) => {
  try {
    const [[usuario]] = await req.db.query(
      "SELECT id, nombre, email, verificado FROM usuarios WHERE id = ?",
      [req.user.id]
    );
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    if (usuario.verificado) {
      return res.json({ message: "Tu cuenta ya está verificada." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await req.db.query(
      "UPDATE usuarios SET verificacion_token = ?, verificacion_expira = ? WHERE id = ?",
      [token, expira, req.user.id]
    );

    let envioOk = true;
    try {
      await sendVerificationEmail({ to: usuario.email, nombre: usuario.nombre, token });
    } catch (mailErr) {
      envioOk = false;
      console.warn("No se pudo enviar el correo de verificación:", mailErr.message);
    }

    res.json({
      message: envioOk
        ? "Hemos enviado un correo con el enlace de verificación."
        : "Se generó el enlace de verificación, pero el envío de correo no está configurado.",
    });
  } catch (err) {
    console.error("Error al solicitar verificación:", err);
    res.status(500).json({ error: "Error al solicitar verificación" });
  }
});

// POST /api/auth/verify - verificar cuenta con token
router.post("/verify", async (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Token inválido" });
  }

  try {
    const [[usuario]] = await req.db.query(
      "SELECT id FROM usuarios WHERE verificacion_token = ? AND verificacion_expira > NOW()",
      [token]
    );
    if (!usuario) {
      return res
        .status(400)
        .json({ error: "Token inválido o expirado. Solicita uno nuevo." });
    }

    await req.db.query(
      "UPDATE usuarios SET verificado = 1, verificacion_token = NULL, verificacion_expira = NULL WHERE id = ?",
      [usuario.id]
    );

    res.json({ message: "Tu cuenta ha sido verificada correctamente." });
  } catch (err) {
    console.error("Error al verificar cuenta:", err);
    res.status(500).json({ error: "Error al verificar cuenta" });
  }
});

// PUT /api/auth/me/password - cambiar contraseña del usuario autenticado
router.put("/me/password", verifyToken, async (req, res) => {
  const { passwordActual, passwordNueva } = req.body || {};

  if (!passwordActual || !passwordNueva) {
    return res
      .status(400)
      .json({ error: "Debes enviar la contraseña actual y la nueva." });
  }
  if (String(passwordNueva).length < 6) {
    return res
      .status(400)
      .json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  try {
    const [[usuario]] = await req.db.query(
      "SELECT id, password FROM usuarios WHERE id = ?",
      [req.user.id]
    );
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const ok = await bcrypt.compare(passwordActual, usuario.password);
    if (!ok) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta." });
    }

    const misma = await bcrypt.compare(passwordNueva, usuario.password);
    if (misma) {
      return res
        .status(400)
        .json({ error: "La nueva contraseña no puede ser igual a la actual." });
    }

    const hash = await bcrypt.hash(passwordNueva, 10);
    await req.db.query("UPDATE usuarios SET password = ? WHERE id = ?", [
      hash,
      req.user.id,
    ]);

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (err) {
    console.error("Error al cambiar contraseña:", err);
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
});

module.exports = router;
