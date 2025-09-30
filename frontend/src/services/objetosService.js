// frontend/src/services/objetosService.js
import api from './api';

const objetosService = {
  // GET /articulos/:id/objetos
  getObjetosByArticulo: async (articuloId) => {
    const res = await api.get(`/articulos/${articuloId}/objetos`);
    return res.data;
  },

  // POST /articulos/:id/objetos  (crear SKU manual)
  createObjeto: async (articuloId, data) => {
    const res = await api.post(`/articulos/${articuloId}/objetos`, data);
    return res.data;
  },

  // POST /articulos/:id/objetos/generar
  generarObjetos: async (articuloId, data) => {
    const res = await api.post(`/articulos/${articuloId}/objetos/generar`, data);
    return res.data;
  },

  // PUT /objetos/:id
  updateObjeto: async (id, data) => {
    const res = await api.put(`/objetos/${id}`, data);
    return res.data;
  },

  // DELETE /objetos/:id
  deleteObjeto: async (id) => {
    const res = await api.delete(`/objetos/${id}`);
    return res.data;
  }
};

export default objetosService;