const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const verifyPermiso = require('../middleware/permisos');
const dbSelector = require('../middleware/dbSelector');

const router = express.Router();

// Middleware para seleccionar entorno
router.use(dbSelector);

// --- Configuración multer para subir fotos de testimonios ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../img/testimonios'));
  },
  filename: (req, file, cb) => {
    cb(null, 'testimonio-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/**
 * GET últimos 3 testimonios
 */
router.get('/ultimos', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      'SELECT * FROM testimonios ORDER BY id DESC LIMIT 3'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener testimonios', error: err.message });
  }
});

/**
 * GET todos los testimonios (para el mantenedor)
 */
router.get('/', authMiddleware, verifyPermiso('editar_testimonios'), async (req, res) => {
  try {
    const [rows] = await req.db.execute('SELECT * FROM testimonios ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener testimonios', error: err.message });
  }
});

/**
 * POST crear nuevo testimonio
 */
router.post('/', authMiddleware, verifyPermiso('editar_testimonios'), upload.single('foto'), async (req, res) => {
  try {
    const { nombre, descripcion, calificacion } = req.body;
    const fotoUrl = req.file ? `/img/testimonios/${req.file.filename}` : null;

    await req.db.execute(
      'INSERT INTO testimonios (nombre, descripcion, calificacion, foto_url) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, calificacion, fotoUrl]
    );

    res.json({ message: 'Testimonio creado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear testimonio', error: err.message });
  }
});

/**
 * PATCH actualizar testimonio
 */
router.patch('/:id', authMiddleware, verifyPermiso('editar_testimonios'), upload.single('foto'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, calificacion } = req.body;
    const updates = [];
    const values = [];

    if (nombre) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (descripcion) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (calificacion) {
      updates.push('calificacion = ?');
      values.push(calificacion);
    }
    if (req.file) {
      updates.push('foto_url = ?');
      values.push(`/img/testimonios/${req.file.filename}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
    }

    values.push(id);
    const sql = `UPDATE testimonios SET ${updates.join(', ')} WHERE id = ?`;
    await req.db.execute(sql, values);

    res.json({ message: 'Testimonio actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar testimonio', error: err.message });
  }
});

/**
 * DELETE eliminar testimonio
 */
router.delete('/:id', authMiddleware, verifyPermiso('editar_testimonios'), async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.execute('DELETE FROM testimonios WHERE id = ?', [id]);
    res.json({ message: 'Testimonio eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar testimonio', error: err.message });
  }
});

module.exports = router;