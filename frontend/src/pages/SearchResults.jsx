import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import articulosService from "../services/articulosService";
import "./SearchResults.css";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const arts = await articulosService.getArticulos();
        setItems(arts || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const results = useMemo(() => {
    if (!q) return [];
    return (items || []).filter((it) =>
      String(it.nombre || "").toLowerCase().includes(q)
    );
  }, [items, q]);

  return (
    <div className="search-container">
      <h2 className="search-title">Resultados para “{q || ""}”</h2>
      {loading ? (
        <div className="search-empty">Cargando…</div>
      ) : !q ? (
        <div className="search-empty">Ingresa un término de búsqueda.</div>
      ) : results.length === 0 ? (
        <div className="search-empty">No se encontraron productos.</div>
      ) : (
        <div className="search-grid">
          {results.map((it) => (
            <div key={it.id} className="search-card">
              <div className="search-imgbox">
                <img src={it.foto} alt={it.nombre} onError={(e)=>{ e.currentTarget.style.visibility='hidden'; }} />
              </div>
              <div className="search-info">
                <strong>{it.nombre}</strong>
                {it.precio != null && (
                  <span className="search-price">${Number(it.precio).toLocaleString("es-CL")}</span>
                )}
              </div>
              <div className="search-actions">
                <Link className="btn primary" to="/disenos">Personalizar</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;

