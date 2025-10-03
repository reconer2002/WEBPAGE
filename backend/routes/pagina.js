const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const verifyPermiso = require('../middleware/permisos');
const dbSelector = require('../middleware/dbSelector');

const router = express.Router();

// Middleware para seleccionar entorno
router.use(dbSelector);

// --- Configuración de multer para subir logo ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../img')); // guarda en /backend/img
  },
  filename: (req, file, cb) => {
    cb(null, 'logo-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- GET configuración página ---
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute('SELECT * FROM configuracion_pagina WHERE id = 1');
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener configuración', error: err.message });
  }
});

// --- PATCH logo ---
router.patch('/logo', authMiddleware, verifyPermiso('configurar_pagina'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se envió ningún archivo' });

    const logoUrl = `/img/${req.file.filename}`;
    await req.db.execute('UPDATE configuracion_pagina SET logo_url = ? WHERE id = 1', [logoUrl]);

    res.json({ message: 'Logo actualizado', logo: logoUrl });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar logo', error: err.message });
  }
});

// --- PATCH datos generales (actualiza solo lo que llega en req.body) ---
router.patch('/', authMiddleware, verifyPermiso('configurar_pagina'), async (req, res) => {
  try {
    const allowedFields = ['telefono1','telefono2','color1','color2','color3','direccion','correo_contacto','instagram_url'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
    }

    const sql = `UPDATE configuracion_pagina SET ${updates.join(', ')} WHERE id = 1`;
    await req.db.execute(sql, values);

    res.json({ message: 'Configuración actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar configuración', error: err.message });
  }
});

// --- PATCH estado ---
router.patch('/estado', authMiddleware, verifyPermiso('configurar_pagina'), async (req, res) => {
  const { estado } = req.body;
  try {
    await req.db.execute('UPDATE configuracion_pagina SET estado = ? WHERE id = 1', [estado ? 1 : 0]);
    res.json({ message: 'Estado actualizado', estado });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar estado', error: err.message });
  }
});

module.exports = router;