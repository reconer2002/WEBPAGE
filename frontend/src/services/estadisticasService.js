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

/**
 * 🆕 Obtiene el ranking de productos más vendidos con sus métricas.
 * @returns {Promise<Object>} { rankingVentas, productosSinVentas, metricas }
 */
export const getRankingProductos = async () => {
  const res = await api.get("/estadisticas/productos/ranking");
  
  // Normalizar fotos en los rankings
  if (res.data.rankingVentas) {
    res.data.rankingVentas = res.data.rankingVentas.map(normalizarArticulo);
  }
  if (res.data.productosSinVentas) {
    res.data.productosSinVentas = res.data.productosSinVentas.map(normalizarArticulo);
  }
  
  return res.data;
};

/**
 * 🆕 Obtiene métricas detalladas de un producto específico.
 * @param {number} productoId ID del producto
 * @returns {Promise<Object>} { producto, metricas, ventasPorMes, topClientes }
 */
export const getDetalleProducto = async (productoId) => {
  const res = await api.get(`/estadisticas/productos/${productoId}/detalle`);
  
  // Normalizar foto del producto
  if (res.data.producto) {
    res.data.producto = normalizarArticulo(res.data.producto);
  }
  
  return res.data;
};