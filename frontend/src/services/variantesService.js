// frontend/src/services/variantesService.js
import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Normalizar la variante para que tenga {categoria, nombre} que espera el frontend
const normalizarVariante = (v) => {
  const baseUrl = BASE_URL;
  
  // Normalizar todas las imágenes de vistas
  if (v.imagen && v.imagen.startsWith('/')) {
    v.imagen = `${baseUrl}${v.imagen}`;
  }
  if (v.imagen_frente && v.imagen_frente.startsWith('/')) {
    v.imagen_frente = `${baseUrl}${v.imagen_frente}`;
  }
  if (v.imagen_izquierda && v.imagen_izquierda.startsWith('/')) {
    v.imagen_izquierda = `${baseUrl}${v.imagen_izquierda}`;
  }
  if (v.imagen_derecha && v.imagen_derecha.startsWith('/')) {
    v.imagen_derecha = `${baseUrl}${v.imagen_derecha}`;
  }
  if (v.imagen_detras && v.imagen_detras.startsWith('/')) {
    v.imagen_detras = `${baseUrl}${v.imagen_detras}`;
  }
  
  return {
    ...v,
    categoria: v.nombre_categoria, // nombre de categoría para frontend
    nombre: v.valor                // valor/nombre de la variante
  };
};

const variantesService = {
  getVariantes: async (articuloId) => {
    const res = await api.get(`/articulos/${articuloId}/variantes`);
    return res.data.map(normalizarVariante);
  },

  createVariante: async (articuloId, data) => {
    const formData = new FormData();
    formData.append('nombre_categoria', data.categoria);
    formData.append('valor', data.nombre);
    
    // Agregar archivos de imágenes para cada vista
    if (data.imagenFrenteFile instanceof File) {
      formData.append('imagenFrente', data.imagenFrenteFile);
    }
    if (data.imagenIzquierdaFile instanceof File) {
      formData.append('imagenIzquierda', data.imagenIzquierdaFile);
    }
    if (data.imagenDerechaFile instanceof File) {
      formData.append('imagenDerecha', data.imagenDerechaFile);
    }
    if (data.imagenDetrasFile instanceof File) {
      formData.append('imagenDetras', data.imagenDetrasFile);
    }
    
    const res = await api.post(`/articulos/${articuloId}/variantes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalizarVariante(res.data);
  },

  updateVariante: async (id, data) => {
    const formData = new FormData();
    formData.append('nombre_categoria', data.categoria);
    formData.append('valor', data.nombre);

    // Manejar archivos e indicadores de eliminación para cada vista
    if (data.imagenFrenteFile instanceof File) {
      formData.append('imagenFrente', data.imagenFrenteFile);
    } else if (!data.imagenFrenteFile) {
      formData.append('eliminarImagenFrente', 'true');
    }
    
    if (data.imagenIzquierdaFile instanceof File) {
      formData.append('imagenIzquierda', data.imagenIzquierdaFile);
    } else if (!data.imagenIzquierdaFile) {
      formData.append('eliminarImagenIzquierda', 'true');
    }
    
    if (data.imagenDerechaFile instanceof File) {
      formData.append('imagenDerecha', data.imagenDerechaFile);
    } else if (!data.imagenDerechaFile) {
      formData.append('eliminarImagenDerecha', 'true');
    }
    
    if (data.imagenDetrasFile instanceof File) {
      formData.append('imagenDetras', data.imagenDetrasFile);
    } else if (!data.imagenDetrasFile) {
      formData.append('eliminarImagenDetras', 'true');
    }

    const res = await api.put(`/variantes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalizarVariante(res.data);
  },

  deleteVariante: async (id) => {
    const res = await api.delete(`/variantes/${id}`);
    return res.data;
  },
};

export default variantesService;