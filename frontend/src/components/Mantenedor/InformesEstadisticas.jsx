import React, { useEffect, useState } from "react";
import { getEstadisticas } from "../../services/estadisticasService"; // Importamos el servicio
import "./InformesEstadisticas.css";

const InformesEstadisticas = () => {
  const [datos, setDatos] = useState({
    totalUsuarios: 0,
    // Aquí se agregarían otros campos como totalPedidos, etc.
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Traer estadísticas desde la API al montar
  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        setLoading(true);
        setError(null);
        // Llamada al nuevo servicio
        const data = await getEstadisticas();
        setDatos(data);
      } catch (err) {
        console.error("Error cargando estadísticas:", err);
        setError("Error al cargar las estadísticas. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchEstadisticas();
  }, []);

  return (
    <div className="informes-estadisticas-container">
      <h3>📊 Informes - Estadísticas</h3>
      <p>
        **Nota:** La información se carga del entorno{" "}
        **{localStorage.getItem("entorno") || "prod"}**
      </p>

      {loading && <p>Cargando estadísticas...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!loading && !error && (
        <div className="estadisticas-resumen">
          {/* Tarjeta de cantidad de usuarios */}
          <div className="resumen-card">
            <h4>Cantidad de Usuarios</h4>
            <p className="big-number">{datos.totalUsuarios}</p>
          </div>

          {/* Aquí irían las otras estadísticas y gráficos */}
          {/* <div className="resumen-card">
            <h4>Cantidad de Pedidos</h4>
            <p className="big-number">{datos.totalPedidos}</p>
          </div> */}
        </div>
      )}

      {/* Aquí se agregarán los gráficos de circular y de barras */}
    </div>
  );
};

export default InformesEstadisticas;