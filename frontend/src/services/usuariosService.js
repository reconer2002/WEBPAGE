import api from "./api"; // tu api.js con baseURL /api y token

export const getUsuarios = async (params) => {
  const res = await api.get("/usuarios", { params });
  return res.data;
};

export const updateRolUsuario = async (id, rol) => {
  const res = await api.patch(`/usuarios/${id}/rol`, { rol });
  return res.data;
};

export const updateRolesMasivo = async (ids, rol) => {
  const res = await api.patch("/usuarios/roles", { ids, rol });
  return res.data;
};

export const crearUsuario = async (usuario) => {
  const res = await api.post("/usuarios", usuario);
  return res.data;
};

export const editarUsuario = async (id, usuario) => {
  const res = await api.put(`/usuarios/${id}`, usuario);
  return res.data;
};

export const eliminarUsuario = async (id) => {
  const res = await api.delete(`/usuarios/${id}`);
  return res.data;
};