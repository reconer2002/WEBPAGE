import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Intercepta todas las solicitudes para incluir el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;