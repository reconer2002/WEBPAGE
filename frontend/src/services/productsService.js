import api from './api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const normalize = (p) => {
  if (p?.image && p.image.startsWith('/img/')) {
    return { ...p, image: `${BACKEND_URL}${p.image}` };
  }
  return p;
};

const getProducts = async () => {
  const res = await api.get('/products');
  return (res.data || []).map(normalize);
};

const getProduct = async (id) => {
  const res = await api.get(`/products/${id}`);
  return normalize(res.data);
};

export default {
  getProducts,
  getProduct,
};
