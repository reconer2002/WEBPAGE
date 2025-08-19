import api from "./api";

const mantenedorService = {
  getCategorias: async () => {
    const res = await api.get("/mantenedor/categorias");
    return res.data;
  },

  getSubcategorias: async (categoriaId) => {
    const res = await api.get(`/mantenedor/categorias/${categoriaId}/subcategorias`);
    return res.data;
  },
};

export default mantenedorService;