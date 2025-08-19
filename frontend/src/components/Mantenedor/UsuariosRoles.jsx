import React, { useState, useEffect, useCallback } from "react";
import {
  getRoles,
  getPermisos,
  crearRol,
  borrarRol,
  actualizarPermisosRol,
  getPermisosDisponiblesRol
} from "../../services/rolesService";
import "./UsuariosRoles.css";

const UsuariosRoles = () => {
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [filtroPermiso, setFiltroPermiso] = useState("Todos");
  const [nuevoRolNombre, setNuevoRolNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [permisosDisponibles, setPermisosDisponibles] = useState({}); // { rolId: [] }

  const fetchPermisos = useCallback(async () => {
    try {
      const data = await getPermisos();
      setPermisos(data.map((p) => p.nombre));
    } catch (err) {
      console.error("Error al cargar permisos:", err);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRoles(filtroPermiso === "Todos" ? [] : [filtroPermiso]);
      setRoles(data);
    } catch (err) {
      console.error("Error al cargar roles:", err);
    } finally {
      setLoading(false);
    }
  }, [filtroPermiso]);

  useEffect(() => {
    fetchPermisos();
  }, [fetchPermisos]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleAgregarRol = async (e) => {
    e.preventDefault();
    if (!nuevoRolNombre.trim()) return;
    try {
      const data = await crearRol(nuevoRolNombre);
      setRoles((prev) => [...prev, { ...data, permisos: [], cantidad_usuarios: 0 }]);
      setNuevoRolNombre("");
    } catch (err) {
      console.error("Error al agregar rol:", err);
      alert(err.response?.data?.message || "Error al agregar rol");
    }
  };

  const handleBorrarRol = async (rolId, rolNombre) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el rol "${rolNombre}"? Todos los usuarios con este rol serán cambiados a "cliente".`
    );
    if (!confirmar) return;
    try {
      await borrarRol(rolId);
      setRoles((prev) => prev.filter((r) => r.id_rol !== rolId));
    } catch (err) {
      console.error("Error al borrar rol:", err);
      alert(err.response?.data?.message || "Error al borrar rol");
    }
  };

  const handleQuitarPermiso = async (rolId, permisoId) => {
    try {
      const rol = roles.find(r => r.id_rol === rolId);
      const nuevosPermisos = rol.permisos
        .filter(p => p.id_permiso !== permisoId)
        .map(p => p.id_permiso);
      await actualizarPermisosRol(rolId, nuevosPermisos);
      setRoles(prev =>
        prev.map(r =>
          r.id_rol === rolId
            ? { ...r, permisos: r.permisos.filter(p => p.id_permiso !== permisoId) }
            : r
        )
      );
    } catch (err) {
      console.error("Error al quitar permiso:", err);
    }
  };

  const handleAgregarPermiso = async (rolId, permisoId) => {
    if (!permisoId) return;
    try {
      const rol = roles.find(r => r.id_rol === rolId);
      const nuevosPermisos = [...rol.permisos.map(p => p.id_permiso), parseInt(permisoId)];
      await actualizarPermisosRol(rolId, nuevosPermisos);
      fetchRoles(); // refresca los permisos
    } catch (err) {
      console.error("Error al agregar permiso:", err);
    }
  };

  const loadPermisosDisponibles = async (rolId) => {
    try {
      const data = await getPermisosDisponiblesRol(rolId);
      setPermisosDisponibles((prev) => ({ ...prev, [rolId]: data.permisos_disponibles }));
    } catch (err) {
      console.error("Error al cargar permisos disponibles:", err);
    }
  };

  return (
    <div className="usuarios-roles-container">
      <h3>Usuarios - Roles</h3>

      <form className="agregar-rol-form" onSubmit={handleAgregarRol}>
        <input
          type="text"
          placeholder="Nombre del nuevo rol"
          value={nuevoRolNombre}
          onChange={(e) => setNuevoRolNombre(e.target.value)}
        />
        <button type="submit">Agregar rol</button>
      </form>

      <div className="filtro-permisos">
        <label>Filtrar por permiso:</label>
        <select value={filtroPermiso} onChange={(e) => setFiltroPermiso(e.target.value)}>
          <option value="Todos">Todos</option>
          {permisos.map((perm) => (
            <option key={perm} value={perm}>
              {perm}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Cargando roles...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rol</th>
              <th>Permisos</th>
              <th>Usuarios</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id_rol}>
                <td>{r.nombre_rol}</td>
                <td>
                  {r.permisos.length > 0 ? (
                    r.permisos.map((p) => (
                      <span key={p.id_permiso} className="permiso-badge">
                        {p.nombre_permiso}
                        <button
                          className="quitar-permiso"
                          onClick={() => handleQuitarPermiso(r.id_rol, p.id_permiso)}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    "Sin permisos"
                  )}
                </td>
                <td>{r.cantidad_usuarios}</td>
                <td>
                  <button onClick={() => handleBorrarRol(r.id_rol, r.nombre_rol)}>Borrar rol</button>
                  <div style={{ marginTop: 5 }}>
                    <select
                      onFocus={() => loadPermisosDisponibles(r.id_rol)}
                      onChange={(e) => handleAgregarPermiso(r.id_rol, e.target.value)}
                    >
                      <option value="">Agregar permiso...</option>
                      {(permisosDisponibles[r.id_rol] || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UsuariosRoles;