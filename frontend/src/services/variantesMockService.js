// frontend/src/services/variantesMockService.js

let variantesMock = {
  1: [
    { id: 101, nombre: "Rojo", categoria: "Color", imagen: "/img/variantes/PoleraRoja.png" },
    { id: 102, nombre: "Azul", categoria: "Color", imagen: "/img/variantes/PoleraAzul.png" },
    { id: 201, nombre: "L", categoria: "Tamaño", imagen: null },
    { id: 202, nombre: "M", categoria: "Tamaño", imagen: null },
  ],
  2: [
    { id: 201, nombre: "L", categoria: "Tamaño", imagen: null },
  ],
  3: [],
};

const variantesMockService = {
  getVariantes: async (articuloId) => {
    const data = variantesMock[articuloId] || [];
    return new Promise((resolve) => setTimeout(() => resolve([...data]), 300));
  },
  createVariante: async (articuloId, data) => {
    const nueva = { ...data, id: Date.now() };
    if (!variantesMock[articuloId]) variantesMock[articuloId] = [];
    variantesMock[articuloId].push(nueva);
    return new Promise((resolve) => setTimeout(() => resolve(nueva), 300));
  },
  deleteVariante: async (articuloId, varianteId) => {
    if (!variantesMock[articuloId]) return;
    variantesMock[articuloId] = variantesMock[articuloId].filter(
      (v) => v.id !== varianteId
    );
    return new Promise((resolve) => setTimeout(() => resolve(true), 300));
  },
  updateVariante: async (articuloId, varianteId, data) => {
    if (!variantesMock[articuloId]) return;
    variantesMock[articuloId] = variantesMock[articuloId].map((v) =>
      v.id === varianteId ? { ...v, ...data } : v
    );
    return new Promise((resolve) => setTimeout(() => resolve(true), 300));
  },
};

export default variantesMockService;