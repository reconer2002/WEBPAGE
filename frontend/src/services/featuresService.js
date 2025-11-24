import api from './api';

const featuresService = {
  // Obtener funcionalidades habilitadas (público)
  getEnabledFeatures: async () => {
    const response = await api.get('/features/enabled');
    return response.data;
  },

  // Obtener todas las funcionalidades (admin)
  getAllFeatures: async () => {
    const response = await api.get('/features');
    return response.data;
  },

  // Actualizar una funcionalidad
  updateFeature: async (id, isEnabled) => {
    const response = await api.put(`/features/${id}`, { is_enabled: isEnabled });
    return response.data;
  },

  // Actualizar múltiples funcionalidades
  bulkUpdateFeatures: async (updates) => {
    const response = await api.put('/features/bulk/update', { updates });
    return response.data;
  }
};

export default featuresService;
