import React, { useEffect, useState } from "react";
import { getUsuarios, updateRolUsuario, updateRolesMasivo } from "../../services/usuariosService";
import { getRoles } from "../../services/rolesService";
import "./UsuariosCuentas.css";

const UsuariosCuentas = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);

  const [filtroRol, setFiltroRol] = useState("Todos");
  const [filtroBaneado, setFiltroBaneado] = useState("Todos");
  const [buscador, setBuscador] = useState("");

  // Traer usuarios desde la API al montar
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        const data = await getUsuarios();
        setUsuarios(data);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
    // También cargar roles disponibles desde el backend para poblar los selects
    const fetchRoles = async () => {
      try {
        const data = await getRoles([]); // trae todos los roles
        // data viene como array de objetos { id_rol, nombre_rol, ... }
        setRolesDisponibles(Array.isArray(data) ? data.map(r => r.nombre_rol) : []);
      } catch (err) {
        console.error('Error cargando roles disponibles:', err);
      }
    };
    fetchRoles();
  }, []);

  const toggleSeleccionado = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const toggleBan = async (id) => {
    try {
      const usuario = usuarios.find((u) => u.id === id);
      if (!usuario) return;

      const esBan = usuario.rol !== "baneado";
      if (esBan) {
        const confirmar = window.confirm(`¿Estás seguro de banear al usuario "${usuario.nombre}"?`);
        if (!confirmar) return;
      }

      const nuevoRol = usuario.rol === "baneado" ? "cliente" : "baneado";
      await updateRolUsuario(id, nuevoRol);

      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u))
      );
    } catch (err) {
      console.error("Error cambiando rol:", err);
    }
  };

  const handleRolChange = async (id, nuevoRol) => {
    try {
      await updateRolUsuario(id, nuevoRol);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u))
      );
    } catch (err) {
      console.error("Error actualizando rol:", err);
      alert("No se pudo actualizar el rol del usuario");
    }
  };

  const seleccionarTodos = () => {
    const idsEnPantalla = usuariosFiltrados.map((u) => u.id);
    setSeleccionados(idsEnPantalla);
  };
  const deseleccionarTodos = () => setSeleccionados([]);

  const banMasivo = async () => {
    try {
      const usuariosABanear = seleccionados.filter(
        (id) => usuarios.find((u) => u.id === id)?.rol !== "baneado"
      );
      if (usuariosABanear.length === 0) return;

      const confirmar = window.confirm(
        `¿Estás seguro de banear a ${usuariosABanear.length} usuario(s)?`
      );
      if (!confirmar) return;

      await updateRolesMasivo(usuariosABanear, "baneado");

      setUsuarios((prev) =>
        prev.map((u) =>
          usuariosABanear.includes(u.id) ? { ...u, rol: "baneado" } : u
        )
      );
      deseleccionarTodos();
    } catch (err) {
      console.error("Error baneando usuarios masivamente:", err);
    }
  };

  // Filtrado de usuarios según filtros y buscador
  const usuariosFiltrados = usuarios.filter((u) => {
    // Filtro rol
    if (filtroRol !== "Todos" && u.rol !== filtroRol) return false;

    // Filtro baneado
    if (filtroBaneado === "Baneado" && u.rol !== "baneado") return false;
    if (filtroBaneado === "No baneado" && u.rol === "baneado") return false;

    // Buscador (nombre empieza con)
    if (buscador.trim() && !u.nombre.toLowerCase().startsWith(buscador.toLowerCase())) return false;

    return true;
  });

  return (
    <div className="usuarios-cuentas-container">
      <h3>Usuarios - Cuentas</h3>

    {/* Zona de filtros */}
    <div className="filtros-contenedor">
        <span className="filtros-label">Filtros:</span>
        <div className="filtros">
            <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
        <option value="Todos">Todos los roles</option>
        {(rolesDisponibles.length > 0 ? rolesDisponibles : ["cliente", "admin", "superadmin", "baneado"]).map((rol) => (
          <option key={rol} value={rol}>
          {rol}
          </option>
        ))}
            </select>

            <select value={filtroBaneado} onChange={(e) => setFiltroBaneado(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="Baneado">Baneado</option>
                <option value="No baneado">No baneado</option>
            </select>

            <input
            type="text"
            placeholder="Buscar por nombre"
            value={buscador}
            onChange={(e) => setBuscador(e.target.value)}
            />
        </div>
    </div>

    {/* Zona de acciones */}
    <div className="acciones-contenedor">
        <span className="acciones-label">Acciones:</span>
        <div className="acciones">
            <button onClick={seleccionarTodos}>Seleccionar todos</button>
            <button onClick={deseleccionarTodos}>Deseleccionar todos</button>
            <button onClick={banMasivo}>Banear usuarios seleccionados</button>
        </div>
    </div>

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Casilla</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => (
              <tr key={u.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={seleccionados.includes(u.id)}
                    onChange={() => toggleSeleccionado(u.id)}
                  />
                </td>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.rol}
                    onChange={(e) => handleRolChange(u.id, e.target.value)}
                  >
                    {(rolesDisponibles.length > 0 ? rolesDisponibles : ["cliente", "admin", "superadmin", "baneado"]).map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={() => toggleBan(u.id)}>
                    {u.rol === "baneado" ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UsuariosCuentas;