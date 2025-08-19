import React, { useEffect, useState } from "react";
import { Folder, FolderOpen } from "lucide-react";
import mantenedorService from "../services/mantenedor";
import UsuariosCuentas from "../components/Mantenedor/UsuariosCuentas";
import UsuariosRoles from "../components/Mantenedor/UsuariosRoles";
import "./Mantenedor.css";

const Mantenedor = () => {
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingCatId, setLoadingCatId] = useState(null);
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(null);

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
      // Toggle de subcategorías
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

  // Click en subcategoría usando IDs
  const handleSubcategoriaClick = (catId, subId) => {
    console.log("Subcategoria clickeada:", catId, subId); // debug

    // Ajusta estos IDs según tu base de datos
    if (catId === 1 && subId === 1) {
      setSubcategoriaActiva("Cuentas");
    } else if (catId === 1 && subId === 2) {
      setSubcategoriaActiva("Roles"); // <-- aquí detectamos Roles
    } else {
      setSubcategoriaActiva(null);
    }
  };

  return (
    <div className="mantenedor-container">
      <h2>Mantenedor</h2>
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

      {/* Renderizamos subcategorías según la activa */}
      {subcategoriaActiva === "Cuentas" && <UsuariosCuentas />}
      {subcategoriaActiva === "Roles" && <UsuariosRoles />}
    </div>
  );
};

export default Mantenedor;
