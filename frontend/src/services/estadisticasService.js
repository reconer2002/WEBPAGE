import api from "./api";

// 💡 Lógica de normalización copiada de articulosService.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizarArticulo = (art) => {
    if (art.foto && art.foto.startsWith('/')) {
        art.foto = `${BASE_URL}${art.foto}`;
    }
    
    return art;

};

/**
 * Obtiene las estadísticas generales (usuarios, pedidos, rankings).
 * @returns {Promise<Object>} 
 */
export const getEstadisticas = async () => {
  const res = await api.get("/estadisticas");
  return res.data;
};

/**
 * 🆕 Obtiene datos de resumen de artículos y la lista de artículos.
 * @returns {Promise<Object>} { totalArticulos, totalVariantes, totalDisenos, listaArticulos }
 */
export const getArticulosEstadisticas = async () => {
  const res = await api.get("/estadisticas/articulos");
  
  // 💡 APLICAR NORMALIZACIÓN A LA LISTA DE ARTÍCULOS
  const data = res.data;
  data.listaArticulos = data.listaArticulos.map(normalizarArticulo);

  return data;
};

/**
 * 🆕 Obtiene el conteo de diseños por variante para un artículo específico.
 * @param {number} articuloId ID del artículo
 * @returns {Promise<Array>} Array de objetos con el conteo de diseños por variante.
 */
export const getDisenosPorVariante = async (articuloId) => {
  const res = await api.get(`/estadisticas/articulos/${articuloId}/variantes-disenos`);
  return res.data;
};