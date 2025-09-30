const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /articulos - Listar todos los artículos
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articulos ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    res.status(500).json({ error: 'Error al obtener artículos' });
  }
});

// GET /articulos/:id - Obtener detalle de un artículo
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener artículo:', error);
    res.status(500).json({ error: 'Error al obtener artículo' });
  }
});

// POST /articulos - Crear un artículo nuevo
router.post('/', async (req, res) => {
  try {
    const { nombre, precio, descripcion, foto, descuento, ranking } = req.body;
    
    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
    
    const [result] = await db.query(
      'INSERT INTO articulos (nombre, precio, descripcion, foto, descuento, ranking) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, precio, descripcion || null, foto || null, descuento || 0, ranking || 0]
    );
    
    const [newArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [result.insertId]);
    res.status(201).json(newArticle[0]);
  } catch (error) {
    console.error('Error al crear artículo:', error);
    res.status(500).json({ error: 'Error al crear artículo' });
  }
});

// PUT /articulos/:id - Actualizar artículo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, descripcion, foto, descuento, ranking } = req.body;
    
    // Verificar que el artículo existe
    const [existingArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    await db.query(
      'UPDATE articulos SET nombre = ?, precio = ?, descripcion = ?, foto = ?, descuento = ?, ranking = ? WHERE id = ?',
      [nombre, precio, descripcion, foto, descuento, ranking, id]
    );
    
    const [updatedArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    res.json(updatedArticle[0]);
  } catch (error) {
    console.error('Error al actualizar artículo:', error);
    res.status(500).json({ error: 'Error al actualizar artículo' });
  }
});

// DELETE /articulos/:id - Eliminar artículo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el artículo existe
    const [existingArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    await db.query('DELETE FROM articulos WHERE id = ?', [id]);
    res.json({ message: 'Artículo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    res.status(500).json({ error: 'Error al eliminar artículo' });
  }
});

// GET /articulos/:id/variantes - Listar variantes de un artículo
router.get('/:id/variantes', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el artículo existe
    const [existingArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    const [rows] = await db.query('SELECT * FROM variantes WHERE articulo_id = ? ORDER BY nombre_categoria, valor', [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener variantes:', error);
    res.status(500).json({ error: 'Error al obtener variantes' });
  }
});

// POST /articulos/:id/variantes - Crear variante en un artículo
router.post('/:id/variantes', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_categoria, valor, imagen } = req.body;
    
    if (!nombre_categoria || !valor) {
      return res.status(400).json({ error: 'nombre_categoria y valor son requeridos' });
    }
    
    // Verificar que el artículo existe
    const [existingArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    const [result] = await db.query(
      'INSERT INTO variantes (articulo_id, nombre_categoria, valor, imagen) VALUES (?, ?, ?, ?)',
      [id, nombre_categoria, valor, imagen || null]
    );
    
    const [newVariant] = await db.query('SELECT * FROM variantes WHERE id = ?', [result.insertId]);
    res.status(201).json(newVariant[0]);
  } catch (error) {
    console.error('Error al crear variante:', error);
    res.status(500).json({ error: 'Error al crear variante' });
  }
});

// GET /articulos/:id/objetos - Listar SKUs de un artículo
router.get('/:id/objetos', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el artículo existe
    const [existingArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    // Obtener objetos con sus variantes asociadas
    const [objects] = await db.query(`
      SELECT 
        o.id, 
        o.articulo_id, 
        o.existencias, 
        o.precio,
        GROUP_CONCAT(
          CONCAT(v.nombre_categoria, ':', v.valor) 
          ORDER BY v.nombre_categoria 
          SEPARATOR ', '
        ) as variantes_texto,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', v.id,
            'nombre_categoria', v.nombre_categoria,
            'valor', v.valor,
            'imagen', v.imagen
          )
        ) as variantes
      FROM objeto o
      LEFT JOIN objeto_variante ov ON o.id = ov.objeto_id
      LEFT JOIN variantes v ON ov.variante_id = v.id
      WHERE o.articulo_id = ?
      GROUP BY o.id
      ORDER BY o.id
    `, [id]);
    
    res.json(objects);
  } catch (error) {
    console.error('Error al obtener objetos:', error);
    res.status(500).json({ error: 'Error al obtener objetos' });
  }
});

// POST /articulos/:id/objetos - Crear un SKU manual
router.post('/:id/objetos', async (req, res) => {
  try {
    const { id } = req.params;
    const { existencias, precio, variante_ids } = req.body;
    
    // Verificar que el artículo existe
    const [existingArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    // Crear el objeto
    const [result] = await db.query(
      'INSERT INTO objeto (articulo_id, existencias, precio) VALUES (?, ?, ?)',
      [id, existencias || 0, precio || null]
    );
    
    const objetoId = result.insertId;
    
    // Asociar variantes si se proporcionaron
    if (variante_ids && Array.isArray(variante_ids) && variante_ids.length > 0) {
      for (const varianteId of variante_ids) {
        await db.query(
          'INSERT INTO objeto_variante (objeto_id, variante_id) VALUES (?, ?)',
          [objetoId, varianteId]
        );
      }
    }
    
    // Retornar el objeto creado con sus variantes
    const [newObject] = await db.query(`
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
      FROM objeto o
      LEFT JOIN objeto_variante ov ON o.id = ov.objeto_id
      LEFT JOIN variantes v ON ov.variante_id = v.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [objetoId]);
    
    res.status(201).json(newObject[0]);
  } catch (error) {
    console.error('Error al crear objeto:', error);
    res.status(500).json({ error: 'Error al crear objeto' });
  }
});

// POST /articulos/:id/objetos/generar - Generar todos los objetos combinando variantes
router.post('/:id/objetos/generar', async (req, res) => {
  try {
    const { id } = req.params;
    const { categorias, precio_base, existencias_base } = req.body;
    
    // Verificar que el artículo existe
    const [existingArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de categorías para generar combinaciones' });
    }
    
    // Obtener variantes para cada categoría
    const variantesPorCategoria = {};
    for (const categoria of categorias) {
      const [variantes] = await db.query(
        'SELECT * FROM variantes WHERE articulo_id = ? AND nombre_categoria = ?',
        [id, categoria]
      );
      if (variantes.length === 0) {
        return res.status(400).json({ error: `No se encontraron variantes para la categoría: ${categoria}` });
      }
      variantesPorCategoria[categoria] = variantes;
    }
    
    // Generar todas las combinaciones posibles
    const combinaciones = generarCombinaciones(Object.values(variantesPorCategoria));
    const objetosCreados = [];
    
    for (const combinacion of combinaciones) {
      // Crear objeto
      const [result] = await db.query(
        'INSERT INTO objeto (articulo_id, existencias, precio) VALUES (?, ?, ?)',
        [id, existencias_base || 0, precio_base || null]
      );
      
      const objetoId = result.insertId;
      
      // Asociar variantes
      for (const variante of combinacion) {
        await db.query(
          'INSERT INTO objeto_variante (objeto_id, variante_id) VALUES (?, ?)',
          [objetoId, variante.id]
        );
      }
      
      objetosCreados.push({
        id: objetoId,
        articulo_id: id,
        existencias: existencias_base || 0,
        precio: precio_base || null,
        variantes: combinacion
      });
    }
    
    res.status(201).json({
      message: `${objetosCreados.length} objetos creados exitosamente`,
      objetos: objetosCreados
    });
  } catch (error) {
    console.error('Error al generar objetos:', error);
    res.status(500).json({ error: 'Error al generar objetos' });
  }
});

// Función auxiliar para generar todas las combinaciones posibles
function generarCombinaciones(arrays) {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) return arrays[0].map(item => [item]);
  
  const result = [];
  const firstArray = arrays[0];
  const restCombinations = generarCombinaciones(arrays.slice(1));
  
  for (const item of firstArray) {
    for (const combination of restCombinations) {
      result.push([item, ...combination]);
    }
  }
  
  return result;
}

module.exports = router;