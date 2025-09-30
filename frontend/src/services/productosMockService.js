// frontend/src/services/productosMockService.js

// Datos iniciales de prueba con más artículos y fotos relativas
let articulosMock = [
  { id: 1, nombre: "Polera", precio: 15000, descripcion: "Polera de algodón color rojo", descuento: 0, foto: "/img/Polera.png" },
  { id: 2, nombre: "Poleron", precio: 16000, descripcion: "Polera de algodón color azul", descuento: 10, foto: "/img/Poleron.png" },
  { id: 3, nombre: "Camisa", precio: 15500, descripcion: "Polera de algodón color verde", descuento: 5, foto: "/img/Camisa.png" },
  { id: 4, nombre: "Camisa Vaquera", precio: 17000, descripcion: "Polera de algodón color negro", descuento: 0, foto: "/img/CamisaVaquera.png" },
  { id: 5, nombre: "Chaqueta", precio: 15000, descripcion: "Polera de algodón color blanco", descuento: 0, foto: "/img/Chaqueta.png" },
  { id: 6, nombre: "Chaqueta sin mangas", precio: 16500, descripcion: "Polera de algodón color amarillo", descuento: 5, foto: "/img/ChaquetaSinMangas.png" },
  { id: 7, nombre: "Blusa", precio: 16000, descripcion: "Polera de algodón color naranja", descuento: 0, foto: "/img/Blusa.png" },
  { id: 8, nombre: "Corset", precio: 15500, descripcion: "Polera de algodón color gris", descuento: 0, foto: "/img/Corset.png" },
  { id: 9, nombre: "Gorro", precio: 15500, descripcion: "Polera de algodón color gris", descuento: 0, foto: "/img/GorroPompon.png" },
];

const productosMockService = {
  getArticulos: async () =>
    new Promise((resolve) => setTimeout(() => resolve([...articulosMock]), 300)),

  createArticulo: async (data) => {
    const nuevo = { ...data, id: Date.now() };
    articulosMock.push(nuevo);
    return new Promise((resolve) => setTimeout(() => resolve(nuevo), 300));
  },

  updateArticulo: async (id, data) => {
    articulosMock = articulosMock.map((a) => (a.id === id ? { ...a, ...data } : a));
    return new Promise((resolve) => setTimeout(() => resolve(true), 300));
  },

  deleteArticulo: async (id) => {
    articulosMock = articulosMock.filter((a) => a.id !== id);
    return new Promise((resolve) => setTimeout(() => resolve(true), 300));
  },

  generarObjetos: async (articuloId, options) => {
    console.log("Generando SKUs para artículo:", articuloId, options);
    return new Promise((resolve) => setTimeout(() => resolve(true), 300));
  },
};

// Export default para poder importarlo fácilmente
export default productosMockService;