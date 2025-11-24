// src/components/Main/DisenosDestacados.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./DisenosDestacados.css";

const DisenosDestacados = () => {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDisenos = async () => {
      try {
        const response = await api.get("/disenos/public/slider");
        setDisenos(response.data);
      } catch (error) {
        console.error("Error cargando diseños destacados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisenos();
  }, []);

  if (loading) {
    return (
      <section className="disenos-destacados">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando diseños destacados...</p>
          </div>
        </div>
      </section>
    );
  }

  if (disenos.length === 0) {
    return null;
  }

  return (
    <section className="disenos-destacados">
      <div className="container">
        <div className="section-header">
          <h2>✨ Diseños Destacados</h2>
          <p>Descubre nuestras creaciones más populares</p>
        </div>
        
        <div className="disenos-grid">
          {disenos.map((diseno) => (
            <div 
              key={diseno.id} 
              className="diseno-card"
              onClick={() => navigate(`/disenos/ver/${diseno.id}`)}
            >
              <div className="diseno-image">
                <img 
                  src={diseno.imagen_preview} 
                  alt={diseno.nombre}
                  onError={(e) => {
                    e.target.src = '/img/polera_base.png';
                  }}
                />
                <div className="diseno-overlay">
                  <span className="ver-mas">Ver más</span>
                </div>
              </div>
              <div className="diseno-info">
                <h3>{diseno.nombre}</h3>
                {diseno.costo && (
                  <p className="diseno-precio">
                    ${Number(diseno.costo).toLocaleString('es-CL')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DisenosDestacados;
