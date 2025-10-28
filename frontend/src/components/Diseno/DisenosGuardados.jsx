import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DisenosGuardados.css";
import disenosService from "../../services/disenosService";
import cartService from "../../services/cartService";

const DisenosGuardados = () => {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
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

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
  const resolveImage = (primary, fallback) => {
    const u =
      (primary && String(primary).trim()) ||
      (fallback && String(fallback).trim()) ||
      "";
    if (!u) return "";
    if (/^(https?:)?\/\//i.test(u) || u.startsWith("data:")) return u;
    if (u.startsWith("/img/")) return `${BACKEND_URL}${u}`;
    return u;
  };

  const parseJsonSafe = (val) => {
    try {
      if (!val) return null;
      if (typeof val === "object") return val;
      return JSON.parse(val);
    } catch {
      return null;
    }
  };

  const makePlaceholder = (diseno) => {
    const elementos = parseJsonSafe(diseno.elementos) || [];
    const variantes = parseJsonSafe(diseno.variantes) || {};
    const mainText = Array.isArray(elementos)
      ? (elementos.find((e) => e?.type === "text")?.text || diseno?.nombre || "Diseño")
      : (diseno?.nombre || "Diseño");
    const vista = variantes?.vista ? String(variantes.vista) : "frente";
    const precio = variantes?.precio ? `$${Number(variantes.precio).toLocaleString("es-CL")}` : "";
    const cantidad = variantes?.cantidad ? `x${variantes.cantidad}` : "";
    const subtitle = [vista, cantidad, precio].filter(Boolean).join(" · ");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
  <defs>
    <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffd1dc"/>
      <stop offset="100%" stop-color="#ff678f"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g>
    <rect x="110" y="60" rx="16" ry="16" width="380" height="280" fill="#ff2b5a" opacity="0.85" />
    <text x="300" y="140" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#6b0000" font-weight="700">${(mainText || "").slice(0, 18)}</text>
    <text x="300" y="175" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#ffffff" opacity="0.9">${subtitle}</text>
  </g>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

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
            onClick={() => navigate("/disenos/crear")}
          >
            Crear nuevo diseño
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button
              className="crear-diseno-btn"
              onClick={() => navigate("/disenos/crear")}
            >
              ➕ Crear nuevo diseño
            </button>
          </div>
          <div className="disenos-grid">
          {disenos.map((diseno) => (
            <div key={diseno.id} className="diseno-card">
              <div className="diseno-imgbox">
              <img
                src={
                  resolveImage(diseno.imagen, diseno.articulo_imagen) ||
                  makePlaceholder(diseno)
                }
                alt={diseno.nombre}
                onError={(e) => {
                  const fallback =
                    resolveImage(diseno.articulo_imagen, "/img/Logo.png") ||
                    makePlaceholder(diseno);
                  if (e.currentTarget.src !== fallback && fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
              </div>
              <div className="diseno-info">
                <h3>{diseno.nombre}</h3>
                <p>{diseno.articulo_nombre}</p>
                <p style={{ margin: 0, color: "#0f766e", fontWeight: 600 }}>
                  Stock: {diseno.stock ?? "—"}
                </p>
                {diseno.fecha_modificacion && (
                  <p className="fecha" style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    {(() => {
                      const d = new Date(diseno.fecha_modificacion);
                      return isNaN(d) ? "" : `Modificado: ${d.toLocaleDateString()}`;
                    })()}
                  </p>
                )}
              </div>
              <div className="diseno-actions">
                <button
                  className="editar-btn"
                  onClick={() => {
                    navigate(`/disenos/editar/${diseno.id}`);
                  }}
                >
                  Editar
                </button>
                <button
                  className="agregar-btn"
                  onClick={async () => {
                    try {
                      setAddingId(diseno.id);
                      await cartService.addItem(
                        { id: diseno.articulo_id },
                        1,
                        { customImage: diseno.imagen, designId: diseno.id }
                      );
                      // Éxito silencioso: el contador del carrito se actualiza vía evento
                    } catch (error) {
                      console.error("Error al agregar al carrito:", error);
                      const msg =
                        error.response?.data?.error ||
                        error.message ||
                        "Error al agregar al carrito";
                      alert(msg);
                    } finally {
                      setAddingId(null);
                    }
                  }}
                  disabled={addingId === diseno.id}
                >
                  Agregar al carrito
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
        </>
      )}
    </div>
  );
};

export default DisenosGuardados;