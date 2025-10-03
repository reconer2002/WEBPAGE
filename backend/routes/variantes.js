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

// Configurar upload para múltiples imágenes de vistas de variantes
const uploadMultipleViews = upload.fields([
  { name: 'imagenFrente', maxCount: 1 },
  { name: 'imagenIzquierda', maxCount: 1 },
  { name: 'imagenDerecha', maxCount: 1 },
  { name: 'imagenDetras', maxCount: 1 }
]);

// PUT /variantes/:id - Editar variante
router.put('/:id', uploadMultipleViews, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_categoria, valor, eliminarImagenFrente, eliminarImagenIzquierda, eliminarImagenDerecha, eliminarImagenDetras } = req.body;
    
    if (!nombre_categoria || !valor) {
      return res.status(400).json({ error: 'nombre_categoria y valor son requeridos' });
    }
    
    // Verificar que la variante existe
    const [existingVariant] = await db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    if (existingVariant.length === 0) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }
    
    // Mantener las imágenes actuales por defecto
    let imagenFrenteUrl = existingVariant[0].imagen_frente;
    let imagenIzquierdaUrl = existingVariant[0].imagen_izquierda;
    let imagenDerechaUrl = existingVariant[0].imagen_derecha;
    let imagenDetrasUrl = existingVariant[0].imagen_detras;
    
    // Función helper para eliminar imagen anterior
    const deleteOldImage = (oldImageUrl) => {
      if (oldImageUrl) {
        const oldImagePath = path.join(__dirname, '..', oldImageUrl);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.log('No se pudo eliminar la imagen anterior:', error.message);
        }
      }
    };
    
    // Procesar cada vista
    if (req.files?.imagenFrente) {
      deleteOldImage(imagenFrenteUrl);
      imagenFrenteUrl = `/img/variantes/${req.files.imagenFrente[0].filename}`;
    } else if (eliminarImagenFrente === 'true') {
      deleteOldImage(imagenFrenteUrl);
      imagenFrenteUrl = null;
    }
    
    if (req.files?.imagenIzquierda) {
      deleteOldImage(imagenIzquierdaUrl);
      imagenIzquierdaUrl = `/img/variantes/${req.files.imagenIzquierda[0].filename}`;
    } else if (eliminarImagenIzquierda === 'true') {
      deleteOldImage(imagenIzquierdaUrl);
      imagenIzquierdaUrl = null;
    }
    
    if (req.files?.imagenDerecha) {
      deleteOldImage(imagenDerechaUrl);
      imagenDerechaUrl = `/img/variantes/${req.files.imagenDerecha[0].filename}`;
    } else if (eliminarImagenDerecha === 'true') {
      deleteOldImage(imagenDerechaUrl);
      imagenDerechaUrl = null;
    }
    
    if (req.files?.imagenDetras) {
      deleteOldImage(imagenDetrasUrl);
      imagenDetrasUrl = `/img/variantes/${req.files.imagenDetras[0].filename}`;
    } else if (eliminarImagenDetras === 'true') {
      deleteOldImage(imagenDetrasUrl);
      imagenDetrasUrl = null;
    }
    
    // Mantener retrocompatibilidad: imagen principal es imagen_frente
    const imagenUrl = imagenFrenteUrl;
    
    await db.query(
      'UPDATE variantes SET nombre_categoria = ?, valor = ?, imagen = ?, imagen_frente = ?, imagen_izquierda = ?, imagen_derecha = ?, imagen_detras = ? WHERE id = ?',
      [nombre_categoria, valor, imagenUrl, imagenFrenteUrl, imagenIzquierdaUrl, imagenDerechaUrl, imagenDetrasUrl, id]
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
    
    // Función helper para eliminar imagen
    const deleteImage = (imageUrl) => {
      if (imageUrl) {
        const imagePath = path.join(__dirname, '..', imageUrl);
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (error) {
          console.log('No se pudo eliminar la imagen:', error.message);
        }
      }
    };

    // Eliminar todas las imágenes de vistas si existen
    const variant = existingVariant[0];
    deleteImage(variant.imagen);
    deleteImage(variant.imagen_frente);
    deleteImage(variant.imagen_izquierda);
    deleteImage(variant.imagen_derecha);
    deleteImage(variant.imagen_detras);
    
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