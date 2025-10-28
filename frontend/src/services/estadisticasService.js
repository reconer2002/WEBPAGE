import api from "./api";

/**
 * Obtiene las estadísticas generales de la plataforma.
 * @returns {Promise<Object>} Objeto con las estadísticas (por ahora solo totalUsuarios)
 */
export const getEstadisticas = async () => {
  // GET /api/estadisticas
  const res = await api.get("/estadisticas");
  console.log(res.data);
  return res.data;
};

// Se pueden agregar más funciones aquí a medida que se necesiten.