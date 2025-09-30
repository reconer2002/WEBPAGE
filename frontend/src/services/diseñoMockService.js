// Mock service para la herramienta de diseño
export const articulosMock = [
  {
    id: 1,
    nombre: "Polera",
    imagenBase: "/img/polera_base.png",
    variantes: {
      color: ["rojo", "azul", "negro", "blanco"],
      talla: ["S", "M", "L", "XL"]
    }
  }
];

// Función para simular fetch de artículo por ID
export const obtenerArticuloPorId = async (id) => {
  return new Promise((resolve) => {
    const articulo = articulosMock.find((a) => a.id === id);
    setTimeout(() => resolve(articulo), 200); // simula latencia
  });
};