const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');

// --- Configuración multer para subir fotos de variantes ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../img/variantes')); // guarda en /backend/img/variantes
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
    const { nombre_categoria, valor } = req.body;
    
    if (!nombre_categoria || !valor) {
      return res.status(400).json({ error: 'nombre_categoria y valor son requeridos' });
    }
    
    // Verificar que la variante existe
    const [existingVariant] = await db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    if (existingVariant.length === 0) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }
    
    let imagenUrl = existingVariant[0].imagen; // Mantener la imagen actual por defecto
    
    // Si se subió una nueva imagen
    if (req.file) {
      imagenUrl = `/img/variantes/${req.file.filename}`;
      
      // Eliminar la imagen anterior si existe
      if (existingVariant[0].imagen) {
        const oldImagePath = path.join(__dirname, '..', existingVariant[0].imagen);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.log('No se pudo eliminar la imagen anterior:', error.message);
        }
      }
    }
    
    await db.query(
      'UPDATE variantes SET nombre_categoria = ?, valor = ?, imagen = ? WHERE id = ?',
      [nombre_categoria, valor, imagenUrl, id]
    );
    
    const [updatedVariant] = await db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    res.json(updatedVariant[0]);
  } catch (error) {
    console.error('Error al actualizar variante:', error);
    res.status(500).json({ error: 'Error al actualizar variante' });
  }
});

// DELETE /variantes/:id - Eliminar variante
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la variante existe
    const [existingVariant] = await db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    if (existingVariant.length === 0) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }
    
    // Verificar si la variante está siendo utilizada en algún objeto
    const [objectsUsingVariant] = await db.query(
      'SELECT COUNT(*) as count FROM objeto_variante WHERE variante_id = ?', 
      [id]
    );
    
    if (objectsUsingVariant[0].count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la variante porque está siendo utilizada en objetos existentes' 
      });
    }
    
    // Eliminar la imagen si existe
    if (existingVariant[0].imagen) {
      const imagePath = path.join(__dirname, '..', existingVariant[0].imagen);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.log('No se pudo eliminar la imagen:', error.message);
      }
    }
    
    await db.query('DELETE FROM variantes WHERE id = ?', [id]);
    res.json({ message: 'Variante eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar variante:', error);
    res.status(500).json({ error: 'Error al eliminar variante' });
  }
});

// GET /variantes/:id - Obtener detalle de una variante
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener variante:', error);
    res.status(500).json({ error: 'Error al obtener variante' });
  }
});

module.exports = router;