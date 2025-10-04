import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import "./DisenosGuardados.css";
import disenosMockService from "../../services/disenosMockService";
import { useCart } from "../../context/CartContext";

const DisenosGuardados = forwardRef((props, ref) => {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const cargarDisenos = async () => {
    try {
      setLoading(true);
      const disenosData = await disenosMockService.getDisenos();
      setDisenos(disenosData);
    } catch (error) {
      console.error("Error al cargar diseños:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDisenos();
  }, []);

  // Exponer la función de recarga usando useImperativeHandle
  useImperativeHandle(ref, () => ({
    recargarDisenos: cargarDisenos
  }));

  return (
    <div className="disenos-guardados">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Tus Diseños Guardados</h2>
        {disenos.length > 0 && (
          <button
            onClick={async () => {
              if (window.confirm("¿Estás seguro de que quieres eliminar TODOS los diseños? (Solo para desarrollo)")) {
                await disenosMockService.limpiarDisenos();
                cargarDisenos();
              }
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Limpiar Todo (Dev)
          </button>
        )}
      </div>

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
                <p className="precio">${diseno.precio}</p>
                <p className="vista">Vista: {diseno.vista_principal}</p>
                <p className="fecha">
                  {new Date(diseno.fecha_creacion).toLocaleDateString()}
                </p>
              </div>
              <div className="diseno-actions">
                <button
                  className="cart-btn"
                  onClick={() => {
                    addToCart(diseno);
                  }}
                  title="Agregar al carrito"
                >
                  🛒 Carrito
                </button>
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
                        await disenosMockService.eliminarDiseno(diseno.id);
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
});

export default DisenosGuardados;
