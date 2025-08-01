const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const permisoMiddleware = require('../middleware/permisos');

//Obtener todos los roles (requiere permiso para gestionar_roles)
router.get('/', authMiddleware, permisoMiddleware('gestionar_roles'), async (req, res) => {
  try {
    const [roles] = await db.execute('SELECT * FROM roles');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener roles', error: err.message });
  }
});

//GET /api/permisos lista todos los permisos (está puesta antes de roles/:id porque las rutas estáticas van antes de las dinámicas)
router.get('/permisos', authMiddleware, permisoMiddleware('gestionar_roles'), async (req, res) => {
  try {
    const [permisos] = await db.execute('SELECT * FROM permisos');
    res.json(permisos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener permisos', error: err.message });
  }
});

//GET /api/roles/:id  Obtiene los permisos de cada rol
router.get('/:id', authMiddleware, permisoMiddleware('gestionar_roles'), async (req, res) => {
  const id = req.params.id;
  try {
    const [[rol]] = await db.execute('SELECT * FROM roles WHERE id = ?', [id]);
    if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });

    const [permisos] = await db.execute(
      `SELECT p.* FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ?`, [id]
    );

    res.json({ rol, permisos });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener rol', error: err.message });
  }
});

//POST /api/roles Crea un nuevo rol
router.post('/', authMiddleware, permisoMiddleware('gestionar_roles'), async (req, res) => {
  const { nombre, permisos = [] } = req.body;

  if (!nombre) return res.status(400).json({ message: 'Nombre es requerido' });

  try {
    const [result] = await db.execute('INSERT INTO roles (nombre) VALUES (?)', [nombre]);
    const nuevoRolId = result.insertId;

    if (permisos.length) {
      const values = permisos.map(permisoId => `(${nuevoRolId}, ${permisoId})`).join(',');
      await db.execute(`INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ${values}`);
    }

    res.status(201).json({ message: 'Rol creado', id: nuevoRolId });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear rol', error: err.message });
  }
});

//PUT /api/roles/:id edita el nombre y los permisos del rol
router.put('/:id', authMiddleware, permisoMiddleware('gestionar_roles'), async (req, res) => {
  const id = req.params.id;
  const { nombre, permisos } = req.body;

  try {
    const [[rol]] = await db.execute('SELECT * FROM roles WHERE id = ?', [id]);
    if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });

    if (nombre) {
      await db.execute('UPDATE roles SET nombre = ? WHERE id = ?', [nombre, id]);
    }

    if (Array.isArray(permisos)) {
      //borra permisos actuales y asigna los nuevos
      await db.execute('DELETE FROM rol_permisos WHERE rol_id = ?', [id]);

      if (permisos.length) {
        const values = permisos.map(permisoId => `(${id}, ${permisoId})`).join(',');
        await db.execute(`INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ${values}`);
      }
    }

    res.json({ message: 'Rol actualizado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar rol', error: err.message });
  }
});

//DELETE /api/roles/:id elimina el rol
router.delete('/:id', authMiddleware, permisoMiddleware('gestionar_roles'), async (req, res) => {
  const id = req.params.id;

  try {
    
    await db.execute('DELETE FROM rol_permisos WHERE rol_id = ?', [id]);
    await db.execute('DELETE FROM usuario_roles WHERE rol_id = ?', [id]);

    const [result] = await db.execute('DELETE FROM roles WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Rol no encontrado' });

    

    res.json({ message: 'Rol eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar rol', error: err.message });
  }
});

module.exports = router;