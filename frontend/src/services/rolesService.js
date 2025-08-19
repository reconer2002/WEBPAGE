// services/rolesService.js
import api from "./api"; // tu api.js con interceptores

// Traer roles filtrados por permisos (si array vacío, trae todos)
export const getRoles = async (permisos = []) => {
  const { data } = await api.post("/roles/getfiltro", { permisos });
  return data;
};

// Traer todos los permisos disponibles
export const getPermisos = async () => {
  const { data } = await api.get("/roles/permisos");
  return data;
};

// Crear nuevo rol
export const crearRol = async (nombre) => {
  const { data } = await api.post("/roles", { nombre });
  return data;
};

// Borrar rol y reasignar usuarios a "cliente"
export const borrarRol = async (rolId) => {
  const { data } = await api.delete(`/roles/${rolId}`);
  return data;
};

// Traer permisos de un rol específico
export const getPermisosDeRol = async (rolId) => {
  const { data } = await api.get(`/roles/${rolId}`);
  return data;
};

// Actualizar permisos de un rol (array de ids de permisos)
export const actualizarPermisosRol = async (rolId, permisos) => {
  const { data } = await api.put(`/roles/${rolId}/permisos`, { permisos });
  return data;
};

// Actualizar nombre de un rol
export const actualizarNombreRol = async (rolId, nombre) => {
  const { data } = await api.patch(`/roles/${rolId}/nombre`, { nombre });
  return data;
};

// Traer permisos disponibles para un rol (para agregar nuevos)
export const getPermisosDisponiblesRol = async (rolId) => {
  const { data } = await api.get(`/roles/${rolId}/permisos_disponibles`);
  return data;
};