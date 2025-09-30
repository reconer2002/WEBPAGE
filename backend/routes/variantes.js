const express = require('express');
const router = express.Router();
const db = require('../db');

// PUT /variantes/:id - Editar variante
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_categoria, valor, imagen } = req.body;
    
    if (!nombre_categoria || !valor) {
      return res.status(400).json({ error: 'nombre_categoria y valor son requeridos' });
    }
    
    // Verificar que la variante existe
    const [existingVariant] = await db.query('SELECT * FROM variantes WHERE id = ?', [id]);
    if (existingVariant.length === 0) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }
    
    await db.query(
      'UPDATE variantes SET nombre_categoria = ?, valor = ?, imagen = ? WHERE id = ?',
      [nombre_categoria, valor, imagen || null, id]
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