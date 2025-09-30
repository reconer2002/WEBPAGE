// frontend/src/services/variantesService.js
import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Normalizar la variante para que la imagen tenga la URL completa
const normalizarVariante = (v) => {
  if (v.imagen && v.imagen.startsWith('/')) {
    v.imagen = `${BASE_URL}${v.imagen}`;
  }
  return v;
};

const variantesService = {
  // GET /articulos/:id/variantes
  getVariantesByArticulo: async (articuloId) => {
    const res = await api.get(`/articulos/${articuloId}/variantes`);
    return res.data.map(normalizarVariante);
  },

  // POST /articulos/:id/variantes
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

  // ✅ PUT /variantes/:id (con soporte eliminar imagen)
  updateVariante: async (id, data) => {
    const formData = new FormData();
    formData.append('nombre_categoria', data.categoria);
    formData.append('valor', data.nombre);

    if (data.imagen instanceof File) {
      // Se sube una nueva imagen
      formData.append('imagen', data.imagen);
    } else if (!data.imagen) {
      // ✅ Caso: el usuario eliminó la imagen
      formData.append('eliminarImagen', 'true');
    }

    const res = await api.put(`/variantes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return normalizarVariante(res.data);
  },

  // DELETE /variantes/:id
  deleteVariante: async (id) => {
    const res = await api.delete(`/variantes/${id}`);
    return res.data;
  },
};

export default variantesService;