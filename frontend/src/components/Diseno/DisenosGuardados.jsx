import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DisenosGuardados.css";
import disenosService from "../../services/disenosService";

const DisenosGuardados = () => {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDisenos = async () => {
      try {
        setLoading(true);
        const disenosData = await disenosService.getDisenos();
        setDisenos(disenosData);
      } catch (error) {
        console.error("Error al cargar diseños:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDisenos();
  }, []);

  return (
    <div className="disenos-guardados">
      <h2>Tus Diseños Guardados</h2>

      {loading ? (
        <div className="disenos-loading">
          <p>Cargando diseños...</p>
        </div>
      ) : disenos.length === 0 ? (
        <div className="disenos-empty">
          <p>No tienes diseños guardados</p>
          <button
            className="crear-diseno-btn"
            onClick={() => navigate("/disenos")}
          >
            Crear nuevo diseño
          </button>
        </div>
      ) : (
        <div className="disenos-grid">
          {disenos.map((diseno) => (
            <div key={diseno.id} className="diseno-card">
              <img src={diseno.imagen} alt={diseno.nombre} />
              <div className="diseno-info">
                <h3>{diseno.nombre}</h3>
                <p>{diseno.articulo_nombre}</p>
                <p className="fecha">
                  {new Date(diseno.fecha_creacion).toLocaleDateString()}
                </p>
              </div>
              <div className="diseno-actions">
                <button
                  className="editar-btn"
                  onClick={() => {
                    // TODO: Implementar edición de diseño
                    alert("Funcionalidad de edición en desarrollo");
                  }}
                >
                  Editar
                </button>
                <button
                  className="eliminar-btn"
                  onClick={async () => {
                    if (
                      window.confirm(
                        "¿Estás seguro de que quieres eliminar este diseño?"
                      )
                    ) {
                      try {
                        await disenosService.eliminarDiseno(diseno.id);
                        setDisenos(disenos.filter((d) => d.id !== diseno.id));
                      } catch (error) {
                        console.error("Error al eliminar diseño:", error);
                        alert("Error al eliminar el diseño");
                      }
                    }
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisenosGuardados;
