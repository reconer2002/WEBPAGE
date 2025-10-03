// backend/routes/articulos.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');

// --- Helpers ---
function ensureDirSync(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (e) {
    // ignore if exists or created
  }
}

function toLocalPathFromDbUrl(dbUrl) {
  // dbUrl viene como "/img/articulos/archivo.png"
  // Lo convertimos a ruta local: "<root>/img/articulos/archivo.png"
  if (!dbUrl) return null;
  const rel = dbUrl.replace(/^\//, ''); // quitar "/" inicial
  return path.join(__dirname, '..', rel);
}

// --- Configuración multer para ARTÍCULOS ---
const articulosDir = path.join(__dirname, '../img/articulos');
ensureDirSync(articulosDir);

const storageArticulos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, articulosDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'articulo-' + Date.now() + path.extname(file.originalname));
  }
});

const fileFilterImagenes = (req, file, cb) => {
  if (/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Sube una imagen.'));
  }
};

const uploadArticulos = multer({ storage: storageArticulos, fileFilter: fileFilterImagenes });

// Configurar upload para múltiples imágenes de vistas
const uploadMultipleViewsArticulos = uploadArticulos.fields([
  { name: 'fotoFrente', maxCount: 1 },
  { name: 'fotoIzquierda', maxCount: 1 },
  { name: 'fotoDerecha', maxCount: 1 },
  { name: 'fotoDetras', maxCount: 1 }
]);

// --- Configuración multer para VARIANTES (usada en este mismo router) ---
const variantesDir = path.join(__dirname, '../img/variantes');
ensureDirSync(variantesDir);

const storageVariantes = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, variantesDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'variante-' + Date.now() + path.extname(file.originalname));
  }
});

const uploadVariantes = multer({ storage: storageVariantes, fileFilter: fileFilterImagenes });

// Configurar upload para múltiples imágenes de vistas de variantes
const uploadMultipleViewsVariantes = uploadVariantes.fields([
  { name: 'imagenFrente', maxCount: 1 },
  { name: 'imagenIzquierda', maxCount: 1 },
  { name: 'imagenDerecha', maxCount: 1 },
  { name: 'imagenDetras', maxCount: 1 }
]);

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
router.post('/', uploadMultipleViewsArticulos, async (req, res) => {
  try {
    const { nombre, precio, descripcion, descuento, ranking } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    // Procesar imágenes para cada vista
    const fotoFrenteUrl = req.files?.fotoFrente ? `/img/articulos/${req.files.fotoFrente[0].filename}` : null;
    const fotoIzquierdaUrl = req.files?.fotoIzquierda ? `/img/articulos/${req.files.fotoIzquierda[0].filename}` : null;
    const fotoDerechaUrl = req.files?.fotoDerecha ? `/img/articulos/${req.files.fotoDerecha[0].filename}` : null;
    const fotoDetrasUrl = req.files?.fotoDetras ? `/img/articulos/${req.files.fotoDetras[0].filename}` : null;
    
    // Mantener retrocompatibilidad: si hay foto_frente, también la ponemos en foto
    const fotoUrl = fotoFrenteUrl;

    const [result] = await db.query(
      'INSERT INTO articulos (nombre, precio, descripcion, foto, foto_frente, foto_izquierda, foto_derecha, foto_detras, descuento, ranking) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, precio, descripcion || null, fotoUrl, fotoFrenteUrl, fotoIzquierdaUrl, fotoDerechaUrl, fotoDetrasUrl, descuento || 0, ranking || 0]
    );

    const [newArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [result.insertId]);
    res.status(201).json(newArticle[0]);
  } catch (error) {
    console.error('Error al crear artículo:', error);
    res.status(500).json({ error: 'Error al crear artículo' });
  }
});

// PUT /articulos/:id - Actualizar artículo
router.put('/:id', uploadMultipleViewsArticulos, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, descripcion, descuento, ranking } = req.body;

    // Verificar que el artículo existe
    const [existingArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    // Mantener las imágenes actuales por defecto
    let fotoFrenteUrl = existingArticle[0].foto_frente;
    let fotoIzquierdaUrl = existingArticle[0].foto_izquierda;
    let fotoDerechaUrl = existingArticle[0].foto_derecha;
    let fotoDetrasUrl = existingArticle[0].foto_detras;

    // Función helper para eliminar imagen anterior
    const deleteOldImage = (oldImageUrl) => {
      if (oldImageUrl) {
        const oldImagePath = toLocalPathFromDbUrl(oldImageUrl);
        try {
          if (oldImagePath && fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.log('No se pudo eliminar la imagen anterior:', error.message);
        }
      }
    };

    // Procesar cada vista si se subió una nueva imagen
    if (req.files?.fotoFrente) {
      deleteOldImage(fotoFrenteUrl);
      fotoFrenteUrl = `/img/articulos/${req.files.fotoFrente[0].filename}`;
    }
    
    if (req.files?.fotoIzquierda) {
      deleteOldImage(fotoIzquierdaUrl);
      fotoIzquierdaUrl = `/img/articulos/${req.files.fotoIzquierda[0].filename}`;
    }
    
    if (req.files?.fotoDerecha) {
      deleteOldImage(fotoDerechaUrl);
      fotoDerechaUrl = `/img/articulos/${req.files.fotoDerecha[0].filename}`;
    }
    
    if (req.files?.fotoDetras) {
      deleteOldImage(fotoDetrasUrl);
      fotoDetrasUrl = `/img/articulos/${req.files.fotoDetras[0].filename}`;
    }

    // Mantener retrocompatibilidad: foto principal es foto_frente
    const fotoUrl = fotoFrenteUrl;

    await db.query(
      'UPDATE articulos SET nombre = ?, precio = ?, descripcion = ?, foto = ?, foto_frente = ?, foto_izquierda = ?, foto_derecha = ?, foto_detras = ?, descuento = ?, ranking = ? WHERE id = ?',
      [nombre, precio, descripcion || null, fotoUrl, fotoFrenteUrl, fotoIzquierdaUrl, fotoDerechaUrl, fotoDetrasUrl, descuento || 0, ranking || 0, id]
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

    // Función helper para eliminar imagen
    const deleteImage = (imageUrl) => {
      if (imageUrl) {
        const imagePath = toLocalPathFromDbUrl(imageUrl);
        try {
          if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (error) {
          console.log('No se pudo eliminar la imagen:', error.message);
        }
      }
    };

    // Eliminar todas las imágenes de vistas si existen
    const article = existingArticle[0];
    deleteImage(article.foto);
    deleteImage(article.foto_frente);
    deleteImage(article.foto_izquierda);
    deleteImage(article.foto_derecha);
    deleteImage(article.foto_detras);

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

    const [rows] = await db.query(
      'SELECT * FROM variantes WHERE articulo_id = ? ORDER BY nombre_categoria, valor',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener variantes:', error);
    res.status(500).json({ error: 'Error al obtener variantes' });
  }
});

// POST /articulos/:id/variantes - Crear variante en un artículo (con imágenes opcionales por vista)
router.post('/:id/variantes', uploadMultipleViewsVariantes, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_categoria, valor } = req.body;

    if (!nombre_categoria || !valor) {
      return res.status(400).json({ error: 'nombre_categoria y valor son requeridos' });
    }

    // Verificar que el artículo existe
    const [existingArticle] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    // Procesar imágenes para cada vista
    const imagenFrenteUrl = req.files?.imagenFrente ? `/img/variantes/${req.files.imagenFrente[0].filename}` : null;
    const imagenIzquierdaUrl = req.files?.imagenIzquierda ? `/img/variantes/${req.files.imagenIzquierda[0].filename}` : null;
    const imagenDerechaUrl = req.files?.imagenDerecha ? `/img/variantes/${req.files.imagenDerecha[0].filename}` : null;
    const imagenDetrasUrl = req.files?.imagenDetras ? `/img/variantes/${req.files.imagenDetras[0].filename}` : null;
    
    // Mantener retrocompatibilidad: si hay imagen_frente, también la ponemos en imagen
    const imagenUrl = imagenFrenteUrl;

    const [result] = await db.query(
      'INSERT INTO variantes (articulo_id, nombre_categoria, valor, imagen, imagen_frente, imagen_izquierda, imagen_derecha, imagen_detras) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, nombre_categoria, valor, imagenUrl, imagenFrenteUrl, imagenIzquierdaUrl, imagenDerechaUrl, imagenDetrasUrl]
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
    const [objects] = await db.query(
      `
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
                'categoria', v.nombre_categoria,
                'nombre', v.valor,
                'imagen', v.imagen
              )
            ELSE NULL
          END
        ) as variantes
      FROM objetos o
      LEFT JOIN objeto_variante ov ON o.id = ov.objeto_id
      LEFT JOIN variantes v ON ov.variante_id = v.id
      WHERE o.articulo_id = ?
      GROUP BY o.id
      ORDER BY o.id
      `,
      [id]
    );

    // Asegurar que variantes nunca sea [null] sino un array vacío si no hay
    const objetosNormalizados = objects.map(obj => ({
      id: obj.id,
      articulo_id: obj.articulo_id,
      existencias: obj.existencias,
      precio: obj.precio,
      variantes: obj.variantes.filter(v => v !== null)
    }));

    res.json(objetosNormalizados);
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
      'INSERT INTO objetos (articulo_id, existencias, precio) VALUES (?, ?, ?)',
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
    const [newObject] = await db.query(
        `
        SELECT 
            o.id, 
            o.articulo_id, 
            o.existencias, 
            o.precio,
            JSON_ARRAYAGG(
            CASE WHEN v.id IS NOT NULL THEN
                JSON_OBJECT(
                'id', v.id,
                'nombre_categoria', v.nombre_categoria,
                'valor', v.valor,
                'imagen', v.imagen
                )
            ELSE NULL END
            ) as variantes
        FROM objetos o
        LEFT JOIN objeto_variante ov ON o.id = ov.objeto_id
        LEFT JOIN variantes v ON ov.variante_id = v.id
        WHERE o.id = ?
        GROUP BY o.id
        `,
        [objetoId]
    );

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
        'INSERT INTO objetos (articulo_id, existencias, precio) VALUES (?, ?, ?)',
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
