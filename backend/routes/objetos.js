const express = require('express');
const router = express.Router();
const db = require('../db');

// PUT /objetos/:id - Actualizar stock o precio de un SKU
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { existencias, precio } = req.body;
    
    // Verificar que el objeto existe
    const [existingObject] = await db.query('SELECT * FROM objetos WHERE id = ?', [id]);
    if (existingObject.length === 0) {
      return res.status(404).json({ error: 'Objeto no encontrado' });
    }
    
    // Construir la consulta dinámicamente basada en los campos proporcionados
    const updates = [];
    const values = [];
    
    if (existencias !== undefined) {
      updates.push('existencias = ?');
      values.push(existencias);
    }
    
    if (precio !== undefined) {
      updates.push('precio = ?');
      values.push(precio);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Se debe proporcionar al menos existencias o precio para actualizar' });
    }
    
    values.push(id);
    
    await db.query(
      `UPDATE objetos SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Retornar el objeto actualizado con sus variantes
    const [updatedObject] = await db.query(`
      SELECT 
        o.id, 
        o.articulo_id, 
        o.existencias, 
        o.precio,
        JSON_ARRAYAGG(
          CASE 
            WHEN v.id IS NOT NULL THEN
              JSON_OBJECT(
                'id', v.id,
                'nombre_categoria', v.nombre_categoria,
                'valor', v.valor,
                'imagen', v.imagen
              )
            ELSE NULL
          END
        ) as variantes
      FROM objetos o
      LEFT JOIN objeto_variante ov ON o.id = ov.objeto_id
      LEFT JOIN variantes v ON ov.variante_id = v.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [id]);
    
    res.json(updatedObject[0]);
  } catch (error) {
    console.error('Error al actualizar objeto:', error);
    res.status(500).json({ error: 'Error al actualizar objeto' });
  }
});

// DELETE /objetos/:id - Eliminar un SKU
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el objeto existe
    const [existingObject] = await db.query('SELECT * FROM objetos WHERE id = ?', [id]);
    if (existingObject.length === 0) {
      return res.status(404).json({ error: 'Objeto no encontrado' });
    }
    
    await db.query('DELETE FROM objetos WHERE id = ?', [id]);
    res.json({ message: 'Objeto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar objeto:', error);
    res.status(500).json({ error: 'Error al eliminar objeto' });
  }
});

// GET /objetos/:id - Obtener detalle de un objeto
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.query(`
      SELECT 
        o.id, 
        o.articulo_id, 
        o.existencias, 
        o.precio,
        JSON_ARRAYAGG(
          CASE 
            WHEN v.id IS NOT NULL THEN
              JSON_OBJECT(
                'id', v.id,
                'nombre_categoria', v.nombre_categoria,
                'valor', v.valor,
                'imagen', v.imagen
              )
            ELSE NULL
          END
        ) as variantes
      FROM objetos o
      LEFT JOIN objeto_variante ov ON o.id = ov.objeto_id
      LEFT JOIN variantes v ON ov.variante_id = v.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Objeto no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener objeto:', error);
    res.status(500).json({ error: 'Error al obtener objeto' });
  }
});

// POST /objetos/:id/variantes - Asociar variantes a un SKU
router.post('/:id/variantes', async (req, res) => {
  try {
    const { id } = req.params;
    const { variante_ids } = req.body;
    
    if (!variante_ids || !Array.isArray(variante_ids) || variante_ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de variante_ids' });
    }
    
    // Verificar que el objeto existe
    const [existingObject] = await db.query('SELECT * FROM objetos WHERE id = ?', [id]);
    if (existingObject.length === 0) {
      return res.status(404).json({ error: 'Objeto no encontrado' });
    }
    
    // Verificar que todas las variantes existen
    const [existingVariants] = await db.query(
      `SELECT id FROM variantes WHERE id IN (${variante_ids.map(() => '?').join(',')})`,
      variante_ids
    );
    
    if (existingVariants.length !== variante_ids.length) {
      return res.status(400).json({ error: 'Una o más variantes no existen' });
    }
    
    // Asociar variantes (eliminar asociaciones existentes primero)
    await db.query('DELETE FROM objeto_variante WHERE objeto_id = ?', [id]);
    
    for (const varianteId of variante_ids) {
      await db.query(
        'INSERT INTO objeto_variante (objeto_id, variante_id) VALUES (?, ?)',
        [id, varianteId]
      );
    }
    
    // Retornar el objeto actualizado con sus variantes
    const [updatedObject] = await db.query(`
      SELECT 
        o.id, 
        o.articulo_id, 
        o.existencias, 
        o.precio,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', v.id,
            'nombre_categoria', v.nombre_categoria,
            'valor', v.valor,
            'imagen', v.imagen
          )
        ) as variantes
      FROM objetos o
      LEFT JOIN objeto_variante ov ON o.id = ov.objeto_id
      LEFT JOIN variantes v ON ov.variante_id = v.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [id]);
    
    res.json({
      message: 'Variantes asociadas exitosamente',
      objeto: updatedObject[0]
    });
  } catch (error) {
    console.error('Error al asociar variantes:', error);
    res.status(500).json({ error: 'Error al asociar variantes' });
  }
});

// DELETE /objetos/:id/variantes/:variante_id - Eliminar relación específica
router.delete('/:id/variantes/:variante_id', async (req, res) => {
  try {
    const { id, variante_id } = req.params;
    
    // Verificar que la relación existe
    const [existingRelation] = await db.query(
      'SELECT * FROM objeto_variante WHERE objeto_id = ? AND variante_id = ?',
      [id, variante_id]
    );
    
    if (existingRelation.length === 0) {
      return res.status(404).json({ error: 'Relación objeto-variante no encontrada' });
    }
    
    await db.query(
      'DELETE FROM objeto_variante WHERE objeto_id = ? AND variante_id = ?',
      [id, variante_id]
    );
    
    res.json({ message: 'Relación objeto-variante eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar relación objeto-variante:', error);
    res.status(500).json({ error: 'Error al eliminar relación objeto-variante' });
  }
});

module.exports = router;