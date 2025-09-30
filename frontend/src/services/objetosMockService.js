// frontend/src/services/objetosMockService.js
import variantesMockService from "./variantesMockService";

let objetos = [
  {
    id: 1,
    articulo_id: 1,
    existencias: 10,
    precio: 12000,
    variantes: [101, 202], // IDs de variantes (Color Rojo, Tamaño M)
  },
  {
    id: 2,
    articulo_id: 1,
    existencias: 5,
    precio: 13000,
    variantes: [102, 201], // Color Azul, Tamaño L
  },
  {
    id: 3,
    articulo_id: 2,
    existencias: 8,
    precio: 25000,
    variantes: [201], // Solo Tamaño L
  },
];

let nextId = objetos.length + 1;
const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

const objetosMockService = {
  getObjetos: async (articuloId) => {
    await delay();
    // Solo objetos del artículo
    return objetos.filter((o) => o.articulo_id === articuloId);
  },

  getCategorias: async (articuloId) => {
    // Obtiene las variantes del artículo y extrae las categorías únicas
    const variantes = await variantesMockService.getVariantes(articuloId);
    const categorias = [...new Set(variantes.map((v) => v.categoria))];
    return categorias;
  },

  createObjeto: async (articuloId, data) => {
    await delay();
    const newObjeto = {
      id: nextId++,
      articulo_id: articuloId,
      existencias: data.existencias || 0,
      precio: data.precio || 0,
      variantes: data.variantes || [],
    };
    objetos.push(newObjeto);
    return newObjeto;
  },

  updateObjeto: async (id, data) => {
    await delay();
    const index = objetos.findIndex((o) => o.id === id);
    if (index === -1) throw new Error("Objeto no encontrado");
    objetos[index] = { ...objetos[index], ...data };
    return objetos[index];
  },

  deleteObjeto: async (id) => {
    await delay();
    objetos = objetos.filter((o) => o.id !== id);
    return true;
  },
};

export default objetosMockService;