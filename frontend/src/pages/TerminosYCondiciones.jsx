import React, { useEffect, useState } from "react";
import terminosService from "../services/terminosService";
import "./TerminosYCondiciones.css";

const TerminosYCondiciones = () => {
  const [data, setData] = useState({
    titulo: "",
    contenido: "",
    fecha_actualizacion: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await terminosService.getTerminos();
        setData(result);
      } catch (error) {
        console.error("Error cargando términos y condiciones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="terminos-container">
        <p className="terminos-loading">Cargando...</p>
      </div>
    );

  return (
    <div className="terminos-container">
      <h1>{data.titulo}</h1>
      <div
        className="terminos-content"
        dangerouslySetInnerHTML={{
          __html: data.contenido.replace(/\n/g, "<br/>"),
        }}
      />
      <p className="terminos-fecha">
        Última actualización:{" "}
        {new Date(data.fecha_actualizacion).toLocaleDateString()}
      </p>
    </div>
  );
};

export default TerminosYCondiciones;