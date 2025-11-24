const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const dbSelector = require('../middleware/dbSelector');

// Middleware para seleccionar la base de datos según el entorno
router.use(dbSelector);

// --- Configuración multer para subir fotos de variantes ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../img/variantes'));
  },
  filename: (req, file, cb) => {
    cb(null, 'variante-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// PUT /variantes/:id - Editar variante
router.put('/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_categoria, valor, eliminarImagen } = req.body;

    if (!nombre_categoria || !valor) {
      return res.status(400).json({ error: 'nombre_categoria y valor son requeridos' });
    }

    const [existingVariant] = await req.db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    if (existingVariant.length === 0) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }

    let imagenUrl = existingVariant[0].imagen;

    if (req.file) {
      imagenUrl = `/img/variantes/${req.file.filename}`;
      if (existingVariant[0].imagen) {
        const oldImagePath = path.join(__dirname, '..', existingVariant[0].imagen);
        try { if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath); } 
        catch (error) { /* Imagen no eliminada */ }
      }
    }

    if (!req.file && eliminarImagen === 'true') {
      if (existingVariant[0].imagen) {
        const oldImagePath = path.join(__dirname, '..', existingVariant[0].imagen);
        try { if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath); } 
        catch (error) { /* Imagen no eliminada */ }
      }
      imagenUrl = null;
    }

    await req.db.query(
      'UPDATE variantes SET nombre_categoria = ?, valor = ?, imagen = ? WHERE id = ?',
      [nombre_categoria, valor, imagenUrl, id]
    );

    const [updatedVariant] = await req.db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    res.json(updatedVariant[0]);
  } catch (error) {
    console.error('Error al actualizar variante:', error);
    res.status(500).json({ error: 'Error al actualizar variante' });
  }
});

// DELETE /variantes/:id - Eliminar variante y sus asociaciones
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existingVariant] = await req.db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    if (existingVariant.length === 0) return res.status(404).json({ error: 'Variante no encontrada' });

    await req.db.query('DELETE FROM objeto_variante WHERE variante_id = ?', [id]);

    if (existingVariant[0].imagen) {
      const imagePath = path.join(__dirname, '..', existingVariant[0].imagen);
      try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } 
      catch (error) { /* Imagen no eliminada */ }
    }

    await req.db.query('DELETE FROM variantes WHERE id = ?', [id]);
    res.json({ message: 'Variante y sus asociaciones eliminadas exitosamente' });
  } catch (error) {
    console.error('Error al eliminar variante:', error);
    res.status(500).json({ error: 'Error al eliminar variante' });
  }
});

// GET /variantes/:id - Obtener detalle de una variante
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await req.db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Variante no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener variante:', error);
    res.status(500).json({ error: 'Error al obtener variante' });
  }
});

module.exports = router;