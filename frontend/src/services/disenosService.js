import api from "./api";

const getDisenos = async () => {
  try {
    const response = await api.get("/disenos", { timeout: 15000 });
    const data = response?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error al obtener diseños:", error);
    return [];
  }
};

const guardarDiseno = async (diseno) => {
  try {
    const response = await api.post("/disenos", diseno);
    return response.data;
  } catch (error) {
    console.error("Error al guardar diseño:", error);
    throw error;
  }
};

const eliminarDiseno = async (id) => {
  try {
    const response = await api.delete(`/disenos/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar diseño:", error);
    throw error;
  }
};

const actualizarDiseno = async (id, diseno) => {
  try {
    const response = await api.put(`/disenos/${id}`, diseno);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar diseño:", error);
    throw error;
  }
};

const getDiseno = async (id) => {
  try {
    const response = await api.get(`/disenos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener diseño:', error);
    throw error;
  }
};

export default {
  getDisenos,
  guardarDiseno,
  eliminarDiseno,
  actualizarDiseno,
  getDiseno,
};