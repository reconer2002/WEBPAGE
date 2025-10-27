import api from "./api";

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
  // usuario debe incluir los campos de persona
  const payload = {
    username: usuario.username,
    email: usuario.email,
    password: usuario.password,
    rol: usuario.rol,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    telefono: usuario.telefono,
    ciudad: usuario.ciudad,
    region: usuario.region,
  };

  const res = await api.post("/usuarios", payload);
  return res.data;
};

export const editarUsuario = async (id, usuario) => {
  // igual que crear, pero usando PUT
  const payload = {
    username: usuario.username,
    email: usuario.email,
    rol: usuario.rol,
    persona: {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono,
      ciudad: usuario.ciudad,
      region: usuario.region,
    },
  };

  const res = await api.put(`/usuarios/${id}`, payload);
  return res.data;
};

export const eliminarUsuario = async (id) => {
  const res = await api.delete(`/usuarios/${id}`);
  return res.data;
};