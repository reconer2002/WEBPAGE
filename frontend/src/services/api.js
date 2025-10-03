import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Intercepta todas las solicitudes para incluir el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepta las respuestas para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo manejamos el 401 si hay un token y no estamos ya en la verificación del usuario actual
    if (
      error.response?.status === 401 &&
      localStorage.getItem("token") &&
      !error.config.url.includes("/auth/me")
    ) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
