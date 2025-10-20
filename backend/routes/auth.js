const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");
const { sendVerificationEmail } = require("../utils/email");
const router = express.Router();
require("dotenv").config();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { nombre, email, password, apellido, direccion } = req.body;

  try {
    // Validar campos requeridos (teléfono ya no es obligatorio)
    if (!nombre || !email || !password) {
      return res
        .status(400)
        .json({ error: "Los campos nombre, email y contraseña son requeridos" });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.query(
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
    let [roles] = await pool.query("SELECT id FROM roles WHERE nombre = ?", [
      "cliente",
    ]);
    if (roles.length === 0) {
      // Intentar crear rol por defecto si no existe
      try {
        await pool.query("INSERT INTO roles (nombre) VALUES (?)", ["cliente"]);
        [roles] = await pool.query("SELECT id FROM roles WHERE nombre = ?", [
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
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, rol_id) VALUES (?, ?, ?, ?)",
      [nombre, email, hashedPassword, rolId]
    );

    // Guardar datos básicos en 'personas' si están disponibles (sin modificar el esquema)
    try {
      await pool.query(
        "INSERT INTO personas (usuario_id, nombre_real, apellido, fecha_nacimiento, direccion) VALUES (?, ?, ?, ?, ?)",
        [result.insertId, nombre, apellido || '', '2000-01-01', direccion || '']
      );
    } catch (_) {}

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
    const [rows] = await pool.query(
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
const verifyToken = require("../middleware/auth");
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [[usuario]] = await pool.query(
      `SELECT 
         u.id,
         u.nombre,
         u.email,
         u.creado_en,
         u.rol_id,
         r.nombre AS rol,
         p.apellido AS persona_apellido,
         p.direccion AS persona_direccion
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       LEFT JOIN personas p ON p.usuario_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const [permisos] = await pool.query(
      `SELECT p.nombre FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ?`,
      [usuario.rol_id]
    );

    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.persona_apellido || '',
      email: usuario.email,
      telefono: null,
      direccion: usuario.persona_direccion || '',
      ciudad: '',
      region: '',
      verificado: false,
      verificacion_expira: null,
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
  const { nombre, apellido, email, direccion } = req.body || {};

  try {
    // Obtener usuario actual
    const [[actual]] = await pool.query(
      "SELECT id, nombre, email FROM usuarios WHERE id = ?",
      [req.user.id]
    );
    if (!actual) return res.status(404).json({ error: "Usuario no encontrado" });

    // Validaciones básicas (teléfono ya no es obligatorio)
    if (!nombre || !email) {
      return res.status(400).json({
        error: "Los campos nombre y email son obligatorios",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Verificar unicidad de email y nombre si cambiaron
    const [conflictos] = await pool.query(
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
    // Actualizar datos básicos de usuario
    await pool.query(
      `UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?`,
      [nombre, email, req.user.id]
    );
    // Actualizar/insertar datos en personas
    const [[persona]] = await pool.query(
      "SELECT id FROM personas WHERE usuario_id = ?",
      [req.user.id]
    );
    if (persona) {
      await pool.query(
        "UPDATE personas SET nombre_real = ?, apellido = ?, direccion = ? WHERE usuario_id = ?",
        [nombre, apellido || '', direccion || '', req.user.id]
      );
    } else {
      await pool.query(
        "INSERT INTO personas (usuario_id, nombre_real, apellido, fecha_nacimiento, direccion) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, nombre, apellido || '', '2000-01-01', direccion || '']
      );
    }

    res.json({ message: "Perfil actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

// POST /api/auth/verify/request - enviar email de verificación
router.post("/verify/request", verifyToken, async (_req, res) => {
  // El esquema actual no contempla verificación por token.
  return res.json({ message: "Verificación no requerida en este entorno." });
});

// POST /api/auth/verify - verificar cuenta con token
router.post("/verify", async (_req, res) => {
  return res.json({ message: "Verificación no habilitada." });
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
    const [[usuario]] = await pool.query(
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
    await pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [
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
