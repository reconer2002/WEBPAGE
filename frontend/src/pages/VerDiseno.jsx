import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import cartService from "../services/cartService";
import CanvasVisualizacion from "../components/CanvasVisualizacion";
import "./VerDiseno.css";

const VerDiseno = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diseno, setDiseno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vistaActual, setVistaActual] = useState(null);
  const [agregandoCarrito, setAgregandoCarrito] = useState(false);

  useEffect(() => {
    const fetchDiseno = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/disenos/public/${id}`);
        const disenoData = response.data;
        setDiseno(disenoData);
        
        // Establecer la primera vista disponible que realmente tenga elementos
        if (disenoData.vistas_disponibles && disenoData.vistas_disponibles.length > 0) {
          // Usar la primera vista disponible (el backend ya filtró las que tienen elementos)
          setVistaActual(disenoData.vistas_disponibles[0]);
        }
      } catch (err) {
        console.error("Error cargando diseño:", err);
        setError(err.response?.data?.error || "Error al cargar el diseño");
      } finally {
        setLoading(false);
      }
    };

    fetchDiseno();
  }, [id]);

  const handleAgregarCarrito = async () => {
    if (!user) {
      alert("Debes iniciar sesión para agregar productos al carrito");
      return;
    }

    if (diseno.stock <= 0) {
      alert("Este producto no tiene stock disponible");
      return;
    }

    try {
      setAgregandoCarrito(true);
      await cartService.addItem(null, 1, { designId: diseno.id });
      
      alert("Diseño agregado al carrito exitosamente");
      
      // Actualizar el contador del carrito
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error("Error agregando al carrito:", err);
      alert(err.response?.data?.error || "Error al agregar al carrito");
    } finally {
      setAgregandoCarrito(false);
    }
  };

  const cambiarVista = (vista) => {
    setVistaActual(vista);
  };

  if (loading || !vistaActual) {
    return (
      <div className="ver-diseno-container">
        <div className="loading-state">Cargando diseño...</div>
      </div>
    );
  }

  if (error || !diseno) {
    return (
      <div className="ver-diseno-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error || "Diseño no encontrado"}</p>
          <button onClick={() => navigate("/")} className="btn-volver">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const elementosVista = diseno.elementos_por_vista[vistaActual] || [];

  return (
    <div className="ver-diseno-container">
      <button onClick={() => navigate(-1)} className="btn-volver-simple">
        ← Volver
      </button>

      <div className="diseno-content">
        {/* Panel izquierdo - Visualización */}
        <div className="diseno-visualizacion">
          <div className="diseno-canvas-container">
            {/* Siempre renderizar con Canvas si hay elementos disponibles */}
            <CanvasVisualizacion
              canvasWidth={600}
              canvasHeight={600}
              imagenBase={diseno.imagenes_vistas?.[vistaActual] || diseno.articulo_imagen}
              elementos={elementosVista}
            />
          </div>

          {/* Selector de vistas */}
          {diseno.vistas_disponibles && diseno.vistas_disponibles.length > 0 && (
            <div className="vistas-selector">
              {diseno.vistas_disponibles.map(vista => (
                <button
                  key={vista}
                  className={`vista-btn ${vistaActual === vista ? 'active' : ''}`}
                  onClick={() => cambiarVista(vista)}
                >
                  {vista.charAt(0).toUpperCase() + vista.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho - Información y acciones */}
        <div className="diseno-info-panel">
          <h1 className="diseno-titulo">{diseno.nombre}</h1>
          
          <div className="diseno-detalles">
            <div className="detalle-item">
              <span className="detalle-label">Artículo base:</span>
              <span className="detalle-valor">{diseno.articulo_nombre}</span>
            </div>

            <div className="detalle-item">
              <span className="detalle-label">Creado por:</span>
              <span className="detalle-valor">{diseno.creador_nombre}</span>
            </div>

            <div className="detalle-item">
              <span className="detalle-label">Stock disponible:</span>
              <span className={`detalle-valor ${diseno.stock <= 0 ? 'sin-stock' : ''}`}>
                {diseno.stock > 0 ? `${diseno.stock} unidades` : 'Sin stock'}
              </span>
            </div>
          </div>

          <div className="diseno-precio-seccion">
            <div className="precio-breakdown">
              <div className="precio-total">
                <span>Precio:</span>
                <span>${diseno.precio.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>

          <div className="diseno-acciones">
            <button
              onClick={handleAgregarCarrito}
              disabled={agregandoCarrito || diseno.stock <= 0 || !user}
              className="btn-agregar-carrito"
            >
              {agregandoCarrito ? '⏳ Agregando...' : 
               diseno.stock <= 0 ? '❌ Sin stock' :
               !user ? '🔒 Inicia sesión para comprar' :
               '🛒 Agregar al carrito'}
            </button>

            {!user && (
              <p className="info-login">
                Debes <a href="/register">iniciar sesión</a> para comprar este diseño
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerDiseno;
