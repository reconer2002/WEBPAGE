const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const verifyPermiso = require('../middleware/permisos');


/*GET /api/roles*/
/*POST /api/roles
  output: JSON { [id_rol , nombre_rol , cantidad_usuarios , permisos( {id_permiso , nombre permiso} , {} ) ] , []}
*/
router.post("/getfiltro", authMiddleware, verifyPermiso('gestionar_roles'), async (req, res) => {
    const { permisos } = req.body;
    try {
        let filterClause = "";
        let params = [];

        if (Array.isArray(permisos) && permisos.length > 0) {
            filterClause = `
                WHERE r.id IN (
                    SELECT rp.rol_id
                    FROM rol_permisos rp
                    INNER JOIN permisos p ON rp.permiso_id = p.id
                    WHERE p.nombre IN (${permisos.map(() => '?').join(',')})
                    GROUP BY rp.rol_id
                    HAVING COUNT(DISTINCT p.id) = ?
                )
            `;
            params = [...permisos, permisos.length];
        }

        const query = `
            SELECT 
                r.id AS id_rol,
                r.nombre AS nombre_rol,
                p.id AS id_permiso,
                p.nombre AS nombre_permiso,
                (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = r.id) AS cantidad_usuarios
            FROM roles r
            LEFT JOIN rol_permisos rp ON r.id = rp.rol_id
            LEFT JOIN permisos p ON rp.permiso_id = p.id
            ${filterClause}
            ORDER BY r.nombre, p.nombre
        `;

        const [rows] = await db.query(query, params);

        const rolesMap = {};
        rows.forEach(row => {
            if (!rolesMap[row.id_rol]) {
                rolesMap[row.id_rol] = {
                    id_rol: row.id_rol,
                    nombre_rol: row.nombre_rol,
                    cantidad_usuarios: row.cantidad_usuarios,
                    permisos: []
                };
            }
            if (row.id_permiso) {
                rolesMap[row.id_rol].permisos.push({
                    id_permiso: row.id_permiso,
                    nombre_permiso: row.nombre_permiso
                });
            }
        });

        res.json(Object.values(rolesMap));

    } catch (err) {
        console.error("Error al obtener roles:", err);
        res.status(500).json({ error: "Error al obtener roles" });
    }
});


//GET /api/permisos lista todos los permisos (está puesta antes de roles/:id porque las rutas estáticas van antes de las dinámicas)
router.get('/permisos', authMiddleware, verifyPermiso('gestionar_roles'), async (req, res) => {
  try {
    const [permisos] = await db.execute('SELECT * FROM permisos');
    res.json(permisos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener permisos', error: err.message });
  }
});

//GET /api/roles/:id  Obtiene los permisos de cada rol
router.get('/:id', authMiddleware, verifyPermiso('gestionar_roles'), async (req, res) => {
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
router.post('/', authMiddleware, verifyPermiso('gestionar_roles'), async (req, res) => {
    
  const { nombre } = req.body;

  try {
    //Validación de nombre
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ message: 'El nombre del rol es requerido' });
    }

    //Verificar que no exista un rol con el mismo nombre
    const [existe] = await db.execute('SELECT id FROM roles WHERE nombre = ?', [nombre]);
    if (existe.length > 0) {
      return res.status(409).json({ message: 'Ya existe un rol con ese nombre' });
    }

    //Insertar nuevo rol
    const [result] = await db.execute('INSERT INTO roles (nombre) VALUES (?)', [nombre]);

    //Responder con el rol creado
    res.status(201).json({
      id: result.insertId,
      nombre
    });
  } catch (err) {
    console.error('Error al crear rol:', err);
    res.status(500).json({ message: 'Error al crear rol', error: err.message });
  }
});

//PATCH /api/roles/:id/nombre
router.patch('/:id/nombre', authMiddleware, verifyPermiso('gestionar_roles'), async (req, res) => {
  const id = req.params.id;
  const { nombre } = req.body;

  try {
    const [[rol]] = await db.execute('SELECT * FROM roles WHERE id = ?', [id]);
    if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    await db.execute('UPDATE roles SET nombre = ? WHERE id = ?', [nombre, id]);

    res.json({ message: 'Nombre de rol actualizado', id, nombre });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar nombre del rol', error: err.message });
  }
});

// PUT /api/roles/:id/permisos
router.put('/:id/permisos', authMiddleware, verifyPermiso('gestionar_roles'), async (req, res) => {
  const id = req.params.id;
  const { permisos } = req.body; // array de IDs de permisos

  try {
    const [[rol]] = await db.execute('SELECT * FROM roles WHERE id = ?', [id]);
    if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });

    if (!Array.isArray(permisos)) {
      return res.status(400).json({ message: 'Se requiere un array de permisos' });
    }

    // 1. Eliminar permisos actuales
    await db.execute('DELETE FROM rol_permisos WHERE rol_id = ?', [id]);

    // 2. Insertar nuevos permisos (si hay)
    if (permisos.length) {
      const values = permisos.map(permisoId => `(${id}, ${permisoId})`).join(',');
      await db.execute(`INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ${values}`);
    }

    res.json({ message: 'Permisos del rol actualizados', id, permisos });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar permisos del rol', error: err.message });
  }
});

//DELETE /api/roles/:id elimina el rol
router.delete('/:id', authMiddleware, verifyPermiso('gestionar_roles'), async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    // Proteger los primeros 5 roles
    if (id <= 5) {
      return res.status(403).json({ message: 'Este rol es protegido y no puede ser eliminado' });
    }

    const [[rol]] = await db.execute('SELECT * FROM roles WHERE id = ?', [id]);
    if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });

    // 1. Cambiar usuarios con ese rol al rol "cliente"
    const [[clienteRol]] = await db.execute('SELECT id FROM roles WHERE nombre = "cliente" LIMIT 1');
    if (!clienteRol) return res.status(500).json({ message: 'Rol "cliente" no existe, no se puede reasignar usuarios' });

    await db.execute('UPDATE usuarios SET rol_id = ? WHERE rol_id = ?', [clienteRol.id, id]);

    // 2. Borrar sus permisos
    await db.execute('DELETE FROM rol_permisos WHERE rol_id = ?', [id]);

    // 3. Borrar el rol
    await db.execute('DELETE FROM roles WHERE id = ?', [id]);

    res.json({ message: 'Rol eliminado y usuarios reasignados a cliente', id });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar rol', error: err.message });
  }
});

//GET /api/roles/:id/permisos_disponibles
router.get('/:id/permisos_disponibles', authMiddleware, verifyPermiso('gestionar_roles'), async (req, res) => {
  const rolId = req.params.id;

  try {
    //Verificar si el rol existe
    const [[rol]] = await db.execute('SELECT * FROM roles WHERE id = ?', [rolId]);
    if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });

    //Obtener todos los permisos que ya tiene el rol
    const [permisosActuales] = await db.execute(
      'SELECT permiso_id FROM rol_permisos WHERE rol_id = ?',
      [rolId]
    );

    const idsActuales = permisosActuales.map(p => p.permiso_id);

    let query = 'SELECT id, nombre FROM permisos';
    let params = [];

    //Si ya tiene permisos, excluirlos
    if (idsActuales.length > 0) {
      query += ` WHERE id NOT IN (${idsActuales.map(() => '?').join(',')})`;
      params = idsActuales;
    }

    const [permisosDisponibles] = await db.execute(query, params);

    res.json({
      rol: { id: rol.id, nombre: rol.nombre },
      permisos_disponibles: permisosDisponibles
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener permisos disponibles', error: err.message });
  }
});

module.exports = router;