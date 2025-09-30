// frontend/src/services/variantesService.js
import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Normalizar la variante para que tenga {categoria, nombre} que espera el frontend
const normalizarVariante = (v) => {
  if (v.imagen && v.imagen.startsWith('/')) {
    v.imagen = `${BASE_URL}${v.imagen}`;
  }
  return {
    ...v,
    categoria: v.nombre_categoria, // nombre de categoría para frontend
    nombre: v.valor                // valor/nombre de la variante
  };
};

const variantesService = {
  getVariantes: async (articuloId) => {
    const res = await api.get(`/articulos/${articuloId}/variantes`);
    return res.data.map(normalizarVariante);
  },

  createVariante: async (articuloId, data) => {
    const formData = new FormData();
    formData.append('nombre_categoria', data.categoria);
    formData.append('valor', data.nombre);
    if (data.imagen instanceof File) {
      formData.append('imagen', data.imagen);
    }
    const res = await api.post(`/articulos/${articuloId}/variantes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalizarVariante(res.data);
  },

  updateVariante: async (id, data) => {
    const formData = new FormData();
    formData.append('nombre_categoria', data.categoria);
    formData.append('valor', data.nombre);

    if (data.imagen instanceof File) {
      formData.append('imagen', data.imagen);
    } else if (!data.imagen) {
      formData.append('eliminarImagen', 'true');
    }

    const res = await api.put(`/variantes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalizarVariante(res.data);
  },

  deleteVariante: async (id) => {
    const res = await api.delete(`/variantes/${id}`);
    return res.data;
  },
};

export default variantesService;