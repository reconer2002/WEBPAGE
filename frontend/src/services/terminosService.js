import api from "./api";

const getTerminos = async () => {
  try {
    const { data } = await api.get("/terminos");
    return data;
  } catch (err) {
    console.error("Error al obtener términos:", err);
    return { titulo: "Error", contenido: "No se pudieron cargar los términos y condiciones." };
  }
};

export default { getTerminos };