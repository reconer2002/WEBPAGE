import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizarArticulo = (art) => {
  const baseUrl = BASE_URL;
  
  // Normalizar todas las imágenes de vistas
  if (art.foto && art.foto.startsWith('/')) {
    art.foto = `${baseUrl}${art.foto}`;
  }
  if (art.foto_frente && art.foto_frente.startsWith('/')) {
    art.foto_frente = `${baseUrl}${art.foto_frente}`;
  }
  if (art.foto_izquierda && art.foto_izquierda.startsWith('/')) {
    art.foto_izquierda = `${baseUrl}${art.foto_izquierda}`;
  }
  if (art.foto_derecha && art.foto_derecha.startsWith('/')) {
    art.foto_derecha = `${baseUrl}${art.foto_derecha}`;
  }
  if (art.foto_detras && art.foto_detras.startsWith('/')) {
    art.foto_detras = `${baseUrl}${art.foto_detras}`;
  }
  
  return art;
};

const articulosService = {
  getArticulos: async () => {
    const res = await api.get('/articulos');
    return res.data.map(normalizarArticulo);
  },

  getArticuloById: async (id) => {
    const res = await api.get(`/articulos/${id}`);
    return normalizarArticulo(res.data);
  },

  createArticulo: async (data) => {
    const formData = new FormData();
    formData.append('nombre', data.nombre);
    formData.append('precio', data.precio);
    formData.append('descripcion', data.descripcion);
    formData.append('descuento', data.descuento);
    formData.append('ranking', data.ranking);

    // Agregar archivos de imágenes para cada vista
    if (data.fotoFrenteFile instanceof File) {
      formData.append('fotoFrente', data.fotoFrenteFile);
    }
    if (data.fotoIzquierdaFile instanceof File) {
      formData.append('fotoIzquierda', data.fotoIzquierdaFile);
    }
    if (data.fotoDerechaFile instanceof File) {
      formData.append('fotoDerecha', data.fotoDerechaFile);
    }
    if (data.fotoDetrasFile instanceof File) {
      formData.append('fotoDetras', data.fotoDetrasFile);
    }

    const res = await api.post('/articulos', formData);
    return normalizarArticulo(res.data);
  },

  updateArticulo: async (id, data) => {
    const formData = new FormData();
    formData.append('nombre', data.nombre);
    formData.append('precio', data.precio);
    formData.append('descripcion', data.descripcion);
    formData.append('descuento', data.descuento);
    formData.append('ranking', data.ranking);

    // Agregar archivos de imágenes para cada vista
    if (data.fotoFrenteFile instanceof File) {
      formData.append('fotoFrente', data.fotoFrenteFile);
    }
    if (data.fotoIzquierdaFile instanceof File) {
      formData.append('fotoIzquierda', data.fotoIzquierdaFile);
    }
    if (data.fotoDerechaFile instanceof File) {
      formData.append('fotoDerecha', data.fotoDerechaFile);
    }
    if (data.fotoDetrasFile instanceof File) {
      formData.append('fotoDetras', data.fotoDetrasFile);
    }

    const res = await api.put(`/articulos/${id}`, formData);
    return normalizarArticulo(res.data);
  },

  deleteArticulo: async (id) => {
    const res = await api.delete(`/articulos/${id}`);
    return res.data;
  },
};

export default articulosService;