import React, { useEffect, useState } from "react";
import { Folder, FolderOpen } from "lucide-react";
import mantenedorService from "../services/mantenedor";
import paginaService from "../services/paginaService";
import UsuariosCuentas from "../components/Mantenedor/UsuariosCuentas";
import UsuariosRoles from "../components/Mantenedor/UsuariosRoles";
import PaginaConfiguracion from "../components/Mantenedor/PaginaConfiguracion";
import PaginaColores from "../components/Mantenedor/PaginaColores";
import Testimonios from "../components/Mantenedor/Testimonios";
import ProductosArticulos from "../components/Mantenedor/ProductosArticulos";
import ProductosDiseniosBase from "../components/Mantenedor/ProductosDiseniosBase";
import InformesEstadisticas from "../components/Mantenedor/InformesEstadisticas";
import InformesArticulos from "../components/Mantenedor/InformesArticulos";
import PedidosGestion from "../components/Mantenedor/PedidosGestion";
import FeaturesConfig from "../components/Mantenedor/FeaturesConfig";
import "./Mantenedor.css";

// --- 🛑 1. IMPORTA TU ARCHIVO DE ANALYTICS ---
// (Asegúrate de que la ruta sea correcta desde este archivo)
import { Analytics } from "../services/analytics";

const Mantenedor = ({ colores, onActualizarColores }) => {
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingCatId, setLoadingCatId] = useState(null);
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(null);
  const [ultimaSubcategoria, setUltimaSubcategoria] = useState(null);
  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: "" });

  // ✅ Estado para entorno
  const [entorno, setEntorno] = useState(
    localStorage.getItem("entorno") || "prod"
  );

  // --- 🛑 2. AÑADE ESTE USEEFFECT PARA GOOGLE ANALYTICS ---
  useEffect(() => {
    // Este efecto se ejecuta solo una vez cuando el componente se monta
    Analytics.trackEvent("access_maintainer", {
      category: "Navigation",
      label: "Maintainer Page View",
    });
  }, []); // El array vacío [] asegura que se ejecute solo al montar
  // --- FIN DE GOOGLE ANALYTICS ---

  const mostrarNotificacion = (mensaje) => {
    setNotificacion({ mostrar: true, mensaje });
    setTimeout(() => {
      setNotificacion({ mostrar: false, mensaje: "" });
    }, 3000);
  };

  // ✅ Cambiar entorno y guardarlo
  const toggleEntorno = async () => {
    const nuevo = entorno === "prod" ? "test" : "prod";
    localStorage.setItem("entorno", nuevo);
    
    // Guardar la subcategoría actual antes de resetearla
    const subcategoriaPrevia = subcategoriaActiva;
    
    // Resetear la subcategoría activa para forzar desmontaje
    setSubcategoriaActiva(null);
    
    // Actualizar el entorno
    setEntorno(nuevo);
    
    // Recargar los datos de la página (footer/header) para el nuevo entorno
    try {
      const data = await paginaService.getFooterData();
      // Emitir evento global para notificar a Header/Footer que se actualizó la info
      window.dispatchEvent(new CustomEvent('pagina:updated', { detail: data }));
    } catch (err) {
      console.warn('No se pudo obtener datos de página tras cambiar entorno:', err);
      // Emitir evento sin detail para forzar re-fetch en Header/Footer
      window.dispatchEvent(new CustomEvent('pagina:updated'));
    }
    
    // Después de un breve delay, restaurar la subcategoría para forzar remontaje
    setTimeout(() => {
      if (subcategoriaPrevia) {
        setSubcategoriaActiva(subcategoriaPrevia);
      }
    }, 10);
    
    mostrarNotificacion(`Entorno cambiado a: ${nuevo === "prod" ? "Producción" : "Test"}`);
  };

  // Fetch categorías al montar
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        setLoading(true);
        const data = await mantenedorService.getCategorias();
        setCategorias(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando categorías:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategorias();
  }, []);

  // Click en categoría
  const handleCategoriaClick = async (categoriaId) => {
    const entry = subcategorias[categoriaId];

    if (entry) {
      setSubcategorias((prev) => ({
        ...prev,
        [categoriaId]: { ...entry, open: !entry.open },
      }));
      return;
    }

    try {
      setLoadingCatId(categoriaId);
      const data = await mantenedorService.getSubcategorias(categoriaId);
      setSubcategorias((prev) => ({
        ...prev,
        [categoriaId]: { items: Array.isArray(data) ? data : [], open: true },
      }));
    } catch (err) {
      console.error("Error cargando subcategorías:", err);
    } finally {
      setLoadingCatId(null);
    }
  };

  // Click en subcategoría
  const handleSubcategoriaClick = (catId, subId) => {
    let nuevaSubcategoria = null;
    
    // Categoría 1: Usuarios
    if (catId === 1 && subId === 1) {
      nuevaSubcategoria = "Cuentas";
    } else if (catId === 1 && subId === 2) {
      nuevaSubcategoria = "Roles";
    } else if (catId === 1 && subId === 3) {
      nuevaSubcategoria = "Testimonios";
    }
    // Categoría 2: Página
    else if (catId === 2 && subId === 4) {
      nuevaSubcategoria = "PaginaConfiguracion";
    } else if (catId === 2 && subId === 5) {
      nuevaSubcategoria = "PaginaColores";
    } else if (catId === 2 && subId === 6) {
      nuevaSubcategoria = "FeaturesConfig";
    }
    // Categoría 3: Productos
    else if (catId === 3 && subId === 7) {
      nuevaSubcategoria = "Articulos";
    } else if (catId === 3 && subId === 8) {
      nuevaSubcategoria = "PedidosGestion";
    } else if (catId === 3 && subId === 9) {
      nuevaSubcategoria = "DisenosBase";
    }
    // Categoría 4: Informes
    else if (catId === 4 && subId === 10) {
      nuevaSubcategoria = "InformesEstadisticas";
    } else if (catId === 4 && subId === 11) {
      nuevaSubcategoria = "InformesArticulos";
    }
    
    setSubcategoriaActiva(nuevaSubcategoria);
    setUltimaSubcategoria(nuevaSubcategoria);
  };

  return (
    <div className="mantenedor-container">
      {/* Notificación popup */}
      {notificacion.mostrar && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '5px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 9999,
          animation: 'slideDown 0.3s ease-out'
        }}>
          {notificacion.mensaje}
        </div>
      )}

      <h2>Mantenedor</h2>

      {/* ✅ Botón para alternar base de datos */}
      <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={toggleEntorno}
          style={{ 
            padding: "0.5rem 1rem",
            backgroundColor: entorno === "prod" ? "#4CAF50" : "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {entorno === "prod" ? "🟢 Producción" : "🟠 Test"}
        </button>
        <span style={{ fontSize: "0.9rem", color: "#666" }}>
          (Click para cambiar a {entorno === "prod" ? "Test" : "Producción"})
        </span>
      </div>

      {loading && <p>Cargando categorías...</p>}

      <div className="categorias-list">
        {(categorias || []).map((cat) => {
          const entry = subcategorias[cat.id] || { items: [], open: false };
          const isOpen = entry.open;

          return (
            <div key={cat.id} className="categoria-item">
              <button
                className={`categoria-btn ${isOpen ? "active" : ""}`}
                onClick={() => handleCategoriaClick(cat.id)}
                disabled={loadingCatId === cat.id}
              >
                {isOpen ? (
                  <FolderOpen size={18} style={{ marginRight: 8 }} />
                ) : (
                  <Folder size={18} style={{ marginRight: 8 }} />
                )}
                {loadingCatId === cat.id ? "Cargando..." : cat.nombre}
              </button>

              {isOpen && (
                <div className="subcategorias-list">
                  {entry.items.length > 0 ? (
                    entry.items.map((sub) => (
                      <button
                        key={sub.id}
                        className="subcategoria-btn"
                        onClick={() => handleSubcategoriaClick(cat.id, sub.id)}
                      >
                        {sub.nombre}
                      </button>
                    ))
                  ) : (
                    <em className="subcategoria-empty">
                      Sin subcategorías visibles
                    </em>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Renderizar subcategorías */}
      {subcategoriaActiva === "Cuentas" && <UsuariosCuentas key={entorno} />}
      {subcategoriaActiva === "Roles" && <UsuariosRoles key={entorno} />}
      {subcategoriaActiva === "Testimonios" && <Testimonios key={entorno} />}
      {subcategoriaActiva === "PaginaConfiguracion" && <PaginaConfiguracion key={entorno} />}
      {subcategoriaActiva === "PaginaColores" && <PaginaColores key={entorno} onActualizarColores={onActualizarColores} />}
      {subcategoriaActiva === "FeaturesConfig" && <FeaturesConfig key={entorno} />}
      {subcategoriaActiva === "Articulos" && <ProductosArticulos key={entorno} />}
      {subcategoriaActiva === "PedidosGestion" && <PedidosGestion key={entorno} />}
      {subcategoriaActiva === "DisenosBase" && <ProductosDiseniosBase key={entorno} />}
      {subcategoriaActiva === "InformesEstadisticas" && (
        <InformesEstadisticas key={entorno} />
      )}
      {subcategoriaActiva === "InformesArticulos" && <InformesArticulos key={entorno} />}
    </div>
  );
};

export default Mantenedor;