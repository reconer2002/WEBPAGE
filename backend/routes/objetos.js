// backend/routes/objetos.js
const express = require('express');
const router = express.Router();
const dbSelector = require('../middleware/dbSelector');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken, dbSelector);

// --- GET /objetos/:id ---
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await req.db.query(`
      SELECT 
        o.id, o.articulo_id, o.existencias, o.precio, o.disenio_base_id,
        JSON_ARRAYAGG(
          CASE WHEN v.id IS NOT NULL THEN
            JSON_OBJECT('id', v.id, 'nombre_categoria', v.nombre_categoria, 'valor', v.valor, 'imagen', v.imagen)
          ELSE NULL END
        ) as variantes
      FROM objetos o
      LEFT JOIN objeto_variante ov ON o.id = ov.objeto_id
      LEFT JOIN variantes v ON ov.variante_id = v.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [id]);

    if (!rows.length) return res.status(404).json({ error: 'Objeto no encontrado' });

    const obj = rows[0];
    obj.variantes = obj.variantes.filter(v => v !== null);
    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener objeto' });
  }
});

// --- POST /objetos ---
router.post('/', async (req, res) => {
  try {
    const { articulo_id, existencias, precio, variante_ids, disenio_base_id } = req.body;

    const [result] = await req.db.query(
      'INSERT INTO objetos (articulo_id, existencias, precio, disenio_base_id) VALUES (?, ?, ?, ?)',
      [articulo_id, existencias || 0, precio || null, disenio_base_id || null]
    );

    const objetoId = result.insertId;

    if (Array.isArray(variante_ids)) {
      for (const varianteId of variante_ids) {
        await req.db.query('INSERT INTO objeto_variante (objeto_id, variante_id) VALUES (?, ?)', [objetoId, varianteId]);
      }
    }

    const [newObj] = await req.db.query('SELECT * FROM objetos WHERE id = ?', [objetoId]);
    res.status(201).json(newObj[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear objeto' });
  }
});

// --- PUT /objetos/:id ---
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { existencias, precio, variante_ids, disenio_base_id } = req.body;

    const [existing] = await req.db.query('SELECT * FROM objetos WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Objeto no encontrado' });

    const updates = [];
    const values = [];

    if (existencias !== undefined) { updates.push('existencias = ?'); values.push(existencias); }
    if (precio !== undefined) { updates.push('precio = ?'); values.push(precio); }
    if (disenio_base_id !== undefined) { updates.push('disenio_base_id = ?'); values.push(disenio_base_id); }

    if (updates.length) {
      values.push(id);
      await req.db.query(`UPDATE objetos SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (Array.isArray(variante_ids)) {
      await req.db.query('DELETE FROM objeto_variante WHERE objeto_id = ?', [id]);
      for (const vid of variante_ids) {
        await req.db.query('INSERT INTO objeto_variante (objeto_id, variante_id) VALUES (?, ?)', [id, vid]);
      }
    }

    const [updatedObj] = await req.db.query('SELECT * FROM objetos WHERE id = ?', [id]);
    res.json(updatedObj[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar objeto' });
  }
});

module.exports = router;