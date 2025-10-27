import api from './api';

const list = async (params = {}) => {
  const { data } = await api.get('/pedidos', { params });
  return data;
};

const update = async (id, payload) => {
  const { data } = await api.patch(`/pedidos/${id}`, payload);
  return data;
};

export default { list, update };

