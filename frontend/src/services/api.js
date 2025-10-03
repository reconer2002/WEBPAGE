import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ Enviar entorno dinámico
  const entorno = localStorage.getItem('entorno') || 'prod';
  config.headers['x-entorno'] = entorno;

  return config;
});

export default api;