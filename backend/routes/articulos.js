// backend/routes/articulos.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const dbSelector = require('../middleware/dbSelector');

// --- Helpers ---
function ensureDirSync(dirPath) {
  try { fs.mkdirSync(dirPath, { recursive: true }); } catch (e) {}
}
function toLocalPathFromDbUrl(dbUrl) {
  if (!dbUrl) return null;
  const rel = dbUrl.replace(/^\//, '');
  return path.join(__dirname, '..', rel);
}

// --- Configuración multer ---
const articulosDir = path.join(__dirname, '../img/articulos');
ensureDirSync(articulosDir);

const storageArticulos = multer.diskStorage({
  destination: (req, file, cb) => cb(null, articulosDir),
  filename: (req, file, cb) => cb(null, 'articulo-' + Date.now() + path.extname(file.originalname))
});

const variantesDir = path.join(__dirname, '../img/variantes');
ensureDirSync(variantesDir);

const storageVariantes = multer.diskStorage({
  destination: (req, file, cb) => cb(null, variantesDir),
  filename: (req, file, cb) => cb(null, 'variante-' + Date.now() + path.extname(file.originalname))
});

const fileFilterImagenes = (req, file, cb) => {
  if (/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de archivo no permitido. Sube una imagen.'));
};

const uploadArticulos = multer({ storage: storageArticulos, fileFilter: fileFilterImagenes });
const uploadVariantes = multer({ storage: storageVariantes, fileFilter: fileFilterImagenes });

// --- Middlewares ---
router.use(authenticateToken, dbSelector);

// --- CRUD Artículos ---
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM articulos ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    res.status(500).json({ error: 'Error al obtener artículos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await req.db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener artículo:', error);
    res.status(500).json({ error: 'Error al obtener artículo' });
  }
});

router.post('/', uploadArticulos.single('foto'), async (req, res) => {
  try {
    const { nombre, precio, descripcion, descuento, ranking } = req.body;
    if (!nombre || !precio) return res.status(400).json({ error: 'Nombre y precio son requeridos' });

    const fotoUrl = req.file ? `/img/articulos/${req.file.filename}` : null;
    const [result] = await req.db.query(
      'INSERT INTO articulos (nombre, precio, descripcion, foto, descuento, ranking) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, precio, descripcion || null, fotoUrl, descuento || 0, ranking || 0]
    );

    const [newArticle] = await req.db.query('SELECT * FROM articulos WHERE id = ?', [result.insertId]);
    res.status(201).json(newArticle[0]);
  } catch (error) {
    console.error('Error al crear artículo:', error);
    res.status(500).json({ error: 'Error al crear artículo' });
  }
});

router.put('/:id', uploadArticulos.single('foto'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, descripcion, descuento, ranking } = req.body;

    const [existingArticle] = await req.db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (!existingArticle.length) return res.status(404).json({ error: 'Artículo no encontrado' });

    let fotoUrl = existingArticle[0].foto;
    if (req.file) {
      fotoUrl = `/img/articulos/${req.file.filename}`;
      if (existingArticle[0].foto) {
        const oldImagePath = toLocalPathFromDbUrl(existingArticle[0].foto);
        try { if (oldImagePath && fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath); } catch (e) {}
      }
    }

    await req.db.query(
      'UPDATE articulos SET nombre = ?, precio = ?, descripcion = ?, foto = ?, descuento = ?, ranking = ? WHERE id = ?',
      [nombre, precio, descripcion || null, fotoUrl, descuento || 0, ranking || 0, id]
    );

    const [updatedArticle] = await req.db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    res.json(updatedArticle[0]);
  } catch (error) {
    console.error('Error al actualizar artículo:', error);
    res.status(500).json({ error: 'Error al actualizar artículo' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existingArticle] = await req.db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (!existingArticle.length) return res.status(404).json({ error: 'Artículo no encontrado' });

    if (existingArticle[0].foto) {
      const imagePath = toLocalPathFromDbUrl(existingArticle[0].foto);
      try { if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (e) {}
    }

    await req.db.query('DELETE FROM articulos WHERE id = ?', [id]);
    res.json({ message: 'Artículo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    res.status(500).json({ error: 'Error al eliminar artículo' });
  }
});

// --- Variantes ---
router.get('/:id/variantes', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await req.db.query('SELECT * FROM variantes WHERE articulo_id = ? ORDER BY nombre_categoria, valor', [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener variantes:', error);
    res.status(500).json({ error: 'Error al obtener variantes' });
  }
});

router.post('/:id/variantes', uploadVariantes.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_categoria, valor } = req.body;
    const imagenUrl = req.file ? `/img/variantes/${req.file.filename}` : null;

    const [result] = await req.db.query(
      'INSERT INTO variantes (articulo_id, nombre_categoria, valor, imagen) VALUES (?, ?, ?, ?)',
      [id, nombre_categoria, valor, imagenUrl]
    );

    const [newVariant] = await req.db.query('SELECT * FROM variantes WHERE id = ?', [result.insertId]);
    res.status(201).json(newVariant[0]);
  } catch (error) {
    console.error('Error al crear variante:', error);
    res.status(500).json({ error: 'Error al crear variante' });
  }
});

// --- Objetos ---
// backend/routes/articulos.js (GET /:id/objetos)
router.get('/:id/objetos', async (req, res) => {
  try {
    const { id } = req.params;

    const [objects] = await req.db.query(
      `SELECT 
        o.id, o.articulo_id, o.existencias, o.precio, o.disenio_base_id,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', v.id,
              'categoria', v.nombre_categoria,
              'nombre', v.valor,
              'imagen', v.imagen
            )
          ),
          JSON_ARRAY()
        ) AS variantes
      FROM objetos o
      LEFT JOIN objeto_variante ov ON o.id = ov.objeto_id
      LEFT JOIN variantes v ON ov.variante_id = v.id
      WHERE o.articulo_id = ?
      GROUP BY o.id
      ORDER BY o.id`,
      [id]
    );

    // Normalizar variantes: JSON_ARRAYAGG devuelve string en MySQL, convertir a array real
    const objetosNormalizados = objects.map(obj => {
      let variantes = [];
      try {
        variantes = Array.isArray(obj.variantes) ? obj.variantes : JSON.parse(obj.variantes);
      } catch (e) {
        variantes = [];
      }

      // Filtrar cualquier valor null por seguridad
      variantes = variantes.filter(v => v && v.id != null);

      return {
        id: obj.id,
        articulo_id: obj.articulo_id,
        existencias: obj.existencias,
        precio: obj.precio,
        disenio_base_id: obj.disenio_base_id,
        variantes
      };
    });

    res.json(objetosNormalizados);
  } catch (error) {
    console.error('Error al obtener objetos:', error);
    res.status(500).json({ error: 'Error al obtener objetos' });
  }
});

// --- Generar objetos ---
router.post('/:id/objetos/generar', async (req, res) => {
  try {
    const { id } = req.params;
    const { categorias, precio_base, existencias_base, disenio_base_id } = req.body;

    const variantesPorCategoria = {};
    for (const categoria of categorias) {
      const [variantes] = await req.db.query(
        'SELECT * FROM variantes WHERE articulo_id = ? AND nombre_categoria = ?',
        [id, categoria]
      );
      if (!variantes.length) return res.status(400).json({ error: `No se encontraron variantes para la categoría: ${categoria}` });
      variantesPorCategoria[categoria] = variantes;
    }

    const combinaciones = generarCombinaciones(Object.values(variantesPorCategoria));
    const objetosCreados = [];

    for (const combinacion of combinaciones) {
      const [result] = await req.db.query(
        'INSERT INTO objetos (articulo_id, existencias, precio, disenio_base_id) VALUES (?, ?, ?, ?)',
        [id, existencias_base || 0, precio_base || null, disenio_base_id || null]
      );
      const objetoId = result.insertId;

      for (const variante of combinacion) {
        await req.db.query('INSERT INTO objeto_variante (objeto_id, variante_id) VALUES (?, ?)', [objetoId, variante.id]);
      }

      objetosCreados.push({ id: objetoId, articulo_id: id, existencias: existencias_base || 0, precio: precio_base || null, disenio_base_id: disenio_base_id || null, variantes: combinacion });
    }

    res.status(201).json({ message: `${objetosCreados.length} objetos creados`, objetos: objetosCreados });
  } catch (error) {
    console.error('Error al generar objetos:', error);
    res.status(500).json({ error: 'Error al generar objetos' });
  }
});

function generarCombinaciones(arrays) {
  if (!arrays.length) return [[]];
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
