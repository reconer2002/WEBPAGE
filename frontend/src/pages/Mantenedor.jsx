import React, { useEffect, useState } from "react";
import { Folder, FolderOpen } from "lucide-react";
import mantenedorService from "../services/mantenedor";
import UsuariosCuentas from "../components/Mantenedor/UsuariosCuentas";
import UsuariosRoles from "../components/Mantenedor/UsuariosRoles";
import PaginaConfiguracion from "../components/Mantenedor/PaginaConfiguracion";
import PaginaDesactivar from "../components/Mantenedor/PaginaDesactivar";
import PaginaColores from "../components/Mantenedor/PaginaColores";
import Testimonios from "../components/Mantenedor/Testimonios";
import ProductosArticulos from "../components/Mantenedor/ProductosArticulos";
import PedidosGestion from "../components/Mantenedor/PedidosGestion";
import "./Mantenedor.css";

const Mantenedor = () => {
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingCatId, setLoadingCatId] = useState(null);
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(null);

  // ✅ Estado para entorno
  const [entorno, setEntorno] = useState(
    localStorage.getItem("entorno") || "prod"
  );

  // ✅ Cambiar entorno y guardarlo
  const toggleEntorno = async () => {
    const nuevo = entorno === "prod" ? "test" : "prod";
    localStorage.setItem("entorno", nuevo);
    setEntorno(nuevo);
    // Limpiar caches locales y recargar categorías desde el backend con el header x-entorno
    setSubcategorias({});
    setSubcategoriaActiva(null);
    setLoading(true);
    try {
      const data = await mantenedorService.getCategorias();
      setCategorias(Array.isArray(data) ? data : []);
      alert(`Entorno cambiado a: ${nuevo}`);
    } catch (err) {
      console.error("Error recargando categorías:", err);
    } finally {
      setLoading(false);
    }
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
  const handleSubcategoriaClick = (catId, subId, subName = null) => {
    const name = (subName || '').toString().toLowerCase();
    if (catId === 1 && (subId === 1 || name === 'cuentas')) {
      setSubcategoriaActiva("Cuentas");
    } else if (catId === 1 && (subId === 2 || name === 'roles')) {
      setSubcategoriaActiva("Roles");
    } else if (catId === 2 && (subId === 3 || name === 'configuracion')) {
      setSubcategoriaActiva("PaginaConfiguracion");
    } else if (catId === 2 && (subId === 4 || name === 'conexion')) {
      setSubcategoriaActiva("PaginaDesactivar");
    } else if (catId === 2 && (subId === 5 || name === 'colores')) {
      setSubcategoriaActiva("PaginaColores");
    } else if (catId === 3 && (subId === 6 || name === 'testimonios')) {
      setSubcategoriaActiva("Testimonios");
    } else if (catId === 4 && (subId === 7 || name === 'articulos')) {
      setSubcategoriaActiva("Articulos");
    } else if (catId === 4 && (subId === 8 || name === 'pedidos')) {
      setSubcategoriaActiva("Pedidos");
    } else {
      setSubcategoriaActiva(null);
    }
  };

  return (
    <div className="mantenedor-container">
      <h2>Mantenedor</h2>

      {/* ✅ Botón para alternar base de datos */}
      <button
        onClick={toggleEntorno}
        style={{ marginBottom: "1rem", padding: "0.5rem 1rem" }}
      >
        Usar entorno: {entorno === "prod" ? "Producción" : "Test"}
      </button>

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
                        onClick={() => handleSubcategoriaClick(cat.id, sub.id, sub.nombre)}
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
      {subcategoriaActiva === "Cuentas" && <UsuariosCuentas />}
      {subcategoriaActiva === "Roles" && <UsuariosRoles />}
      {subcategoriaActiva === "PaginaConfiguracion" && <PaginaConfiguracion />}
      {subcategoriaActiva === "PaginaDesactivar" && <PaginaDesactivar />}
      {subcategoriaActiva === "PaginaColores" && <PaginaColores />}
      {subcategoriaActiva === "Testimonios" && <Testimonios />}
      {subcategoriaActiva === "Articulos" && <ProductosArticulos />}
      {subcategoriaActiva === "Pedidos" && <PedidosGestion />}
    </div>
  );
};

export default Mantenedor;
