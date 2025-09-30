// frontend/src/services/objetosService.js
import api from './api';

const objetosService = {
  getObjetos: async (articuloId) => {
    const res = await api.get(`/articulos/${articuloId}/objetos`);
    return res.data; // ya vienen con {id, precio, existencias, variantes: [id, id]}
  },

  createObjeto: async (articuloId, data) => {
    const payload = {
      precio: data.precio,
      existencias: data.existencias,
      variante_ids: data.variantes // <-- array de IDs
    };
    const res = await api.post(`/articulos/${articuloId}/objetos`, payload);
    return res.data;
  },

  updateObjeto: async (id, data) => {
    const payload = {
      precio: data.precio,
      existencias: data.existencias,
      variante_ids: data.variantes
    };
    const res = await api.put(`/objetos/${id}`, payload);
    return res.data;
  },

  deleteObjeto: async (id) => {
    const res = await api.delete(`/objetos/${id}`);
    return res.data;
  }
};

export default objetosService;