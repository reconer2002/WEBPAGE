// frontend/src/services/objetosService.js
import api from './api';

const objetosService = {
  getObjetos: async (articuloId) => {
    const res = await api.get(`/articulos/${articuloId}/objetos`);
    return res.data; // objetos con {id, articulo_id, precio, existencias, disenio_base_id, variantes: [...]}
  },

  createObjeto: async (articuloId, data) => {
    const payload = {
      precio: data.precio,
      existencias: data.existencias,
      variante_ids: data.variantes,      // array de IDs de variantes
      disenio_base_id: data.disenio_base_id || null
    };
    const res = await api.post(`/articulos/${articuloId}/objetos`, payload);
    return res.data;
  },

  generateObjetos: async (articuloId, data) => {
    const payload = {
      categorias: data.categorias,
      precio_base: data.precio_base,
      existencias_base: data.existencias_base
    };
    const res = await api.post(`/articulos/${articuloId}/objetos/generar`, payload);
    return res.data;
  },

  updateObjeto: async (objetoId, data) => {
    const payload = {
      precio: data.precio,
      existencias: data.existencias,
      variante_ids: data.variantes,          // array de IDs de variantes
      disenio_base_id: data.disenio_base_id || null  // ⚡ importante
    };
    const res = await api.put(`/objetos/${objetoId}`, payload);
    return res.data;
  },

  deleteObjeto: async (objetoId) => {
    const res = await api.delete(`/objetos/${objetoId}`);
    return res.data;
  }
};

export default objetosService;
