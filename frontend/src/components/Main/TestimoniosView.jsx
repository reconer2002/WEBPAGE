// frontend/src/components/public/TestimoniosView.jsx
import React, { useEffect, useState } from "react";
import { getUltimosTestimonios } from "../../services/testimoniosService";
import "./TestimoniosView.css";

const TestimoniosView = () => {
  const [testimonios, setTestimonios] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUltimosTestimonios();
        setTestimonios(data);
      } catch (err) {
        console.error("Error al obtener últimos testimonios:", err);
        setTestimonios([]);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="testimonios-section">
      <h2 className="titulo">Lo que dicen nuestros clientes</h2>

      <div className="testimonios-grid">
        {testimonios.map((t) => (
          <div key={t.id} className="testimonio-card">
            {t.foto_url ? (
              <img src={t.foto_url} alt={t.nombre} className="testimonio-img" />
            ) : (
              <div className="foto-placeholder">Sin foto</div>
            )}

            <div className="testimonio-overlay">
              <h3 className="testimonio-nombre">{t.nombre}</h3>
              <p className="testimonio-texto">{t.descripcion}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimoniosView;