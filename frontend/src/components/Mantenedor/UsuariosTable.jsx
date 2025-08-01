import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const UsuariosTable = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [rolToAdd, setRolToAdd] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: usuariosData } = await api.get('/usuarios');
        const { data: roles } = await api.get('/roles');

        setUsuarios(
          usuariosData.map(u => ({
            ...u,
            roles: Array.isArray(u.roles) ? u.roles : [],
          }))
        );

        setRolesDisponibles(roles.filter(r => r.nombre !== 'superadmin'));
      } catch (err) {
        console.error('Error al cargar usuarios o roles:', err);
      }
    };

    fetchData();
  }, []);

  const actualizarRolesEnTabla = (userId, nuevosRoles) => {
    setUsuarios(prev =>
      prev.map(u => (u.id === userId ? { ...u, roles: nuevosRoles } : u))
    );
  };

  const handleAgregarRol = async (usuario) => {
    const rolObj = rolesDisponibles.find(r => r.nombre === rolToAdd);
    if (!rolToAdd || !rolObj || usuario.roles.includes(rolToAdd)) return;

    try {
      await api.post(`/usuarios/${usuario.id}/roles`, {
        roles: [...usuario.roles, rolObj.id],
      });

      actualizarRolesEnTabla(usuario.id, [...usuario.roles, rolObj.nombre]);
      setRolToAdd('');
      setSelectedUserId(null);
    } catch (err) {
      console.error('Error al agregar rol:', err);
    }
  };

  const handleEliminarRol = async (usuario, rolNombre) => {
    const rolObj = rolesDisponibles.find(r => r.nombre === rolNombre);
    if (!rolObj) return;

    try {
      await api.delete(`/usuarios/${usuario.id}/roles/${rolObj.id}`);

      const nuevosRoles = usuario.roles.filter(r => r !== rolNombre);
      actualizarRolesEnTabla(usuario.id, nuevosRoles);
    } catch (err) {
      console.error('Error al eliminar rol:', err);
    }
  };

  const handleBanear = (usuario) => {
    alert(`Usuario ${usuario.id} baneado (futuro)`); // Aquí puedes implementar lógica real más adelante
  };

  return (
    <div>
      <h2>Mantenedor de Usuarios</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Fecha creación</th>
            <th>Roles</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(user => (
            <tr key={user.id}>
              <td>{user.nombre}</td>
              <td>{user.email}</td>
              <td>{new Date(user.creado_en || user.created_at).toLocaleDateString()}</td>
              <td>
                <ul style={{ paddingLeft: '20px' }}>
                  {user.roles.map(r => (
                    <li key={r}>
                      {r}{' '}
                      <button
                        onClick={() => handleEliminarRol(user, r)}
                        disabled={user.roles.length <= 1}
                        style={{ marginLeft: '6px' }}
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>
              </td>
              <td>
                {selectedUserId === user.id ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={rolToAdd}
                      onChange={e => setRolToAdd(e.target.value)}
                    >
                      <option value="">Seleccionar rol</option>
                      {rolesDisponibles
                        .filter(r => !user.roles.includes(r.nombre))
                        .map(r => (
                          <option key={r.id} value={r.nombre}>
                            {r.nombre}
                          </option>
                        ))}
                    </select>
                    <button onClick={() => handleAgregarRol(user)}>Agregar</button>
                    <button onClick={() => setSelectedUserId(null)}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setSelectedUserId(user.id)}>
                      Agregar rol
                    </button>{' '}
                    <button onClick={() => handleBanear(user)}>
                      Banear
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsuariosTable;