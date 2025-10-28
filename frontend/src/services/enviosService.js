import api from './api';

const getMyEnvios = async () => {
  const { data } = await api.get('/envios/mios');
  return data;
};

const listEnvios = async (params) => {
  const { data } = await api.get('/envios', { params });
  return data;
};

const updateEnvio = async (id, payload) => {
  const { data } = await api.patch(`/envios/${id}`, payload);
  return data;
};

const getEnvioHistorial = async (id) => {
  const { data } = await api.get(`/envios/${id}/historial`);
  return data;
};

export default { getMyEnvios, listEnvios, updateEnvio, getEnvioHistorial };