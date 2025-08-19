const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require("../middleware/auth"); 
const verifyPermiso = require('../middleware/permisos');


/*GET /api/usuarios
  filtros_posibles: rol, está baneado, no está baneado, filtro de búsqueda
  output: JSON { id , nombre , email , rol }
*/
router.get("/", verifyToken, verifyPermiso('moderar_usuarios'), async (req, res) => {
  try {
    let { nombre, email, rol, baneado, limit, offset } = req.query;

    //Valores por defecto para paginación
    limit = parseInt(limit, 10);
    offset = parseInt(offset, 10);
    if (isNaN(limit) || limit <= 0) limit = 10;
    if (isNaN(offset) || offset < 0) offset = 0;

    let query = `
      SELECT u.id, u.nombre, u.email, r.nombre AS rol
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE 1=1
    `;
    const params = [];

    //Filtros opcionales
    if (nombre) {
      query += " AND u.nombre LIKE ?";
      params.push(`%${nombre}%`);
    }
    if (email) {
      query += " AND u.email LIKE ?";
      params.push(`%${email}%`);
    }
    if (rol) {
      query += " AND r.nombre = ?";
      params.push(rol);
    }
    if (baneado !== undefined) {
      if (baneado === "true") {
        query += " AND r.nombre = 'baneado'";
      } else if (baneado === "false") {
        query += " AND r.nombre != 'baneado'";
      }
    }

    // Orden y paginación
    query += " ORDER BY u.nombre ASC ";
    query += ` LIMIT ${limit} OFFSET ${offset}`;
    
    console.log("query:");
    console.log(query);
    console.log("params:");
    console.log(params);

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/*PATCH /api/usuarios/:id/rol
  Efecto: Cambia el rol de un usuario, incluye banear y desbanear
  Output: JSON { message , usuario: [ id , nombre , email , rol ] }
*/
router.patch('/:id/rol', verifyToken, verifyPermiso('moderar_usuarios'), async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;

    if (!rol) {
        return res.status(400).json({ mensaje: 'El campo rol es obligatorio.' });
    }

    try {
        //Verificar que el rol existe en la tabla roles
        const [rolExistente] = await db.query('SELECT id FROM roles WHERE nombre = ?', [rol]);
        if (rolExistente.length === 0) {
            return res.status(400).json({ mensaje: 'El rol especificado no existe.' });
        }

        //Actualizar rol del usuario
        const [resultado] = await db.query(
            'UPDATE usuarios SET rol_id = ? WHERE id = ?',
            [rolExistente[0].id, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        //Obtener usuario actualizado
        const [usuarioActualizado] = await db.query(
            `SELECT u.id, u.nombre, u.email, r.nombre AS rol
             FROM usuarios u
             INNER JOIN roles r ON u.rol_id = r.id
             WHERE u.id = ?`,
            [id]
        );

        res.json({
            mensaje: 'Rol actualizado correctamente.',
            usuario: usuarioActualizado[0]
        });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
});

/*PATCH /api/usuarios/roles
  Efecto: Cambia el rol de múltiples usuarios, incluye banear y desbanear
  Output: JSON { message , usuarios: [ usuario1: { id , nombre , email , rol } , usuario2: { id , nombre , email , rol } ] }
*/
router.patch('/roles', verifyToken, verifyPermiso('moderar_usuarios'), async (req, res) => {
    try {
      const { ids, rol } = req.body;

      //Validaciones
      if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ error: 'Debes enviar un array con IDs de usuarios.' });
      }
      if (!rol || typeof rol !== 'string') {
          return res.status(400).json({ error: 'Debes enviar un rol válido.' });
      }

      //Verificar que el rol existe y obtener id
      const [rowsRol] = await db.execute('SELECT id FROM roles WHERE nombre = ?', [rol]);
      if (rowsRol.length === 0) {
        return res.status(400).json({ error: `El rol '${rol}' no existe.` });
      }
      const rolId = rowsRol[0].id;

      //Validar IDs de usuarios (enteros únicos)
      const idsInt = Array.from(new Set(
        ids
          .map(i => parseInt(i, 10))
          .filter(n => Number.isInteger(n) && n > 0)
      ));
      if (idsInt.length === 0) {
        return res.status(400).json({ error: 'No se encontraron IDs válidos en el array.' });
      }

      const placeholders = idsInt.map(() => '?').join(',');

      //Ejecutar UPDATE
      const [result] = await db.execute(
        `UPDATE usuarios SET rol_id = ? WHERE id IN (${placeholders})`,
        [rolId, ...idsInt]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'No se actualizaron usuarios (IDs no encontrados).' });
      }

      //Recuperar usuarios actualizados
      const [usuariosActualizados] = await db.execute(
        `SELECT u.id, u.nombre, u.email, r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE u.id IN (${placeholders})
        ORDER BY u.id ASC`,
        idsInt
      );

      return res.json({
      message: `Se actualizaron ${result.affectedRows} usuario(s).`,
      usuarios: usuariosActualizados
      });


    } catch (error) {
        console.error('Error al actualizar roles masivamente:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

//Crear usuario
router.post('/', verifyToken, verifyPermiso('moderar_usuarios'), async (req, res) => {
  const { nombre, email, password } = req.body;
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash(password, 10);

  try {
    await db.execute('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)', [nombre, email, hash]);
    res.status(201).json({ message: 'Usuario creado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear usuario', error: err.message });
  }
});

//Editar usuario (nombre, email)
router.put('/:id', verifyToken, verifyPermiso('moderar_usuarios'), async (req, res) => {
  const { nombre, email } = req.body;
  try {
    await db.execute('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, req.params.id]);
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al editar usuario', error: err.message });
  }
});

//Eliminar usuario
router.delete('/:id', verifyToken, verifyPermiso('moderar_usuarios'), async (req, res) => {
  try {
    await db.execute('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: err.message });
  }
});

module.exports = router;