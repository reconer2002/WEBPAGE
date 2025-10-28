import api from './api';

const getSummary = async () => {
  const { data } = await api.get('/checkout/summary');
  return data;
};

const createSession = async (payload) => {
  // payload puede incluir datos de contacto/envío si luego se usan
  const { data } = await api.post('/checkout/session', payload || {});
  return data; // { orderId, provider, redirectUrl, token, total }
};

const confirmMock = async ({ orderId, token, status }) => {
  const { data } = await api.post('/checkout/mock/confirm', { orderId, token, status });
  return data;
};

export default { getSummary, createSession, confirmMock };