import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizarArticulo = (art) => {
  if (art.foto && art.foto.startsWith('/')) {
    art.foto = `${BASE_URL}${art.foto}`;
  }
  return art;
};

const articulosService = {
  getArticulos: async () => {
    const res = await api.get('/articulos');
    return res.data.map(normalizarArticulo);
  },

  getArticuloById: async (id) => {
    const res = await api.get(`/articulos/${id}`);
    return normalizarArticulo(res.data);
  },

  createArticulo: async (data) => {
    const formData = new FormData();
    formData.append('nombre', data.nombre);
    formData.append('precio', data.precio);
    formData.append('descripcion', data.descripcion);
    formData.append('descuento', data.descuento);
    formData.append('ranking', data.ranking);

    if (data.fotoFile instanceof File) {
      formData.append('foto', data.fotoFile);
    }

    const res = await api.post('/articulos', formData);
    return normalizarArticulo(res.data);
  },

  updateArticulo: async (id, data) => {
    const formData = new FormData();
    formData.append('nombre', data.nombre);
    formData.append('precio', data.precio);
    formData.append('descripcion', data.descripcion);
    formData.append('descuento', data.descuento);
    formData.append('ranking', data.ranking);

    if (data.fotoFile instanceof File) {
      formData.append('foto', data.fotoFile);
    }

    const res = await api.put(`/articulos/${id}`, formData);
    return normalizarArticulo(res.data);
  },

  deleteArticulo: async (id) => {
    const res = await api.delete(`/articulos/${id}`);
    return res.data;
  },
};

export default articulosService;