// frontend/src/services/diseniosBaseService.js
import api from './api';

const diseniosBaseService = {
  // Obtener todos los diseños base
  getAll: async () => {
    const res = await api.get('/disenios_base');
    return res.data; // devuelve un array con {id, nombre, frente, espalda, izquierda, derecha}
  },

  // Obtener un diseño base por ID
  getById: async (id) => {
    const res = await api.get(`/disenios_base/${id}`);
    return res.data;
  },

  // Crear un nuevo diseño base
  create: async (data) => {
    // data = { nombre, frente, espalda, izquierda, derecha }
    const formData = new FormData();
    formData.append('nombre', data.nombre);
    if (data.frente) formData.append('frente', data.frente);       // file
    if (data.espalda) formData.append('espalda', data.espalda);    // file
    if (data.izquierda) formData.append('izquierda', data.izquierda); // file
    if (data.derecha) formData.append('derecha', data.derecha);    // file

    const res = await api.post('/disenios_base', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Actualizar un diseño base
  update: async (id, data) => {
    const formData = new FormData();
    if (data.nombre) formData.append('nombre', data.nombre);
    if (data.frente) formData.append('frente', data.frente);
    if (data.espalda) formData.append('espalda', data.espalda);
    if (data.izquierda) formData.append('izquierda', data.izquierda);
    if (data.derecha) formData.append('derecha', data.derecha);

    const res = await api.put(`/disenios_base/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Eliminar un diseño base
  delete: async (id) => {
    const res = await api.delete(`/disenios_base/${id}`);
    return res.data;
  }
};

export default diseniosBaseService;