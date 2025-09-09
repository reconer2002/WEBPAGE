// frontend/src/services/testimoniosService.js
import api from './api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// Normaliza la URL de la foto
const normalizeUrl = (u) => {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u; // ya es absoluta
  return `${BACKEND_URL}${u}`;            // relativa -> backend
};

// --- Obtener los 3 últimos testimonios (landing) ---
export const getUltimosTestimonios = async () => {
  const res = await api.get('/testimonios/ultimos');
  return res.data.map(t => ({
    ...t,
    foto_url: normalizeUrl(t.foto_url)
  }));
};

// --- Obtener todos los testimonios (mantenedor) ---
export const getTestimonios = async () => {
  const res = await api.get('/testimonios');
  return res.data.map(t => ({
    ...t,
    foto_url: normalizeUrl(t.foto_url)
  }));
};

// --- Crear un nuevo testimonio ---
export const crearTestimonio = async (formData) => {
  const res = await api.post('/testimonios', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// --- Actualizar un testimonio ---
export const actualizarTestimonio = async (id, formData) => {
  const res = await api.patch(`/testimonios/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// --- Eliminar un testimonio ---
export const borrarTestimonio = async (id) => {
  const res = await api.delete(`/testimonios/${id}`);
  return res.data;
};