import React, { useEffect, useState } from 'react';
import enviosService from '../services/enviosService';
import './Checkout.css';
import './MisCompras.css';
import ReviewForm from '../components/ReviewForm/ReviewForm';

const statusLabel = (s) => {
  const map = {
    pendiente: 'Pendiente', preparando: 'Preparando', despachado: 'Despachado', en_transito: 'En tránsito', entregado: 'Entregado', cancelado: 'Cancelado', pagado: 'Pagado'
  };
  return map[s] || s;
};

const MisCompras = () => {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [historial, setHistorial] = useState({}); // { envioId: { loading, error, items: [] } }
  const [reviews, setReviews] = useState({}); // { envioId: { loading, error, exists, estrellas, comentario } }

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
  const resolveImage = (u) => {
    const s = (u && String(u).trim()) || '';
    if (!s) return '';
    if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:')) return s;
    if (s.startsWith('/img/')) return `${BACKEND_URL}${s}`;
    return s;
  };
  const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76"><rect width="100%" height="100%" fill="#f1f5f9"/></svg>`);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await enviosService.getMyEnvios();
        setEnvios(Array.isArray(list) ? list : []);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || 'No se pudieron cargar tus compras');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = async (id) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
    // Cargar historial al expandir por primera vez
    const h = historial[id];
    if (!h || (!h.items && !h.loading)) {
      try {
        setHistorial((prev) => ({ ...prev, [id]: { loading: true, error: null, items: [] } }));
        const items = await enviosService.getEnvioHistorial(id);
        setHistorial((prev) => ({ ...prev, [id]: { loading: false, error: null, items: Array.isArray(items) ? items : [] } }));
        // Try to load existing review (if any)
        try {
          const existing = await enviosService.getReview(id);
          if (existing) {
            setReviews((prev) => ({ ...prev, [id]: { loading: false, error: null, exists: true, estrellas: existing.estrellas, comentario: existing.comentario } }));
          }
        } catch (_) {
          // ignore - no review yet or not allowed
        }
      } catch (e) {
        setHistorial((prev) => ({ ...prev, [id]: { loading: false, error: e?.response?.data?.error || e?.message || 'No se pudo cargar el historial', items: [] } }));
      }
    }
  };

  if (loading) return <div className="checkout-page"><div className="checkout-card">Cargando…</div></div>;
  if (error) return <div className="checkout-page"><div className="checkout-card error">{error}</div></div>;

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <h2>Mis compras</h2>
        {envios.length === 0 ? (
          <p>No tienes compras con envío registradas.</p>
        ) : (
          <div className="purchases">
            <ul className="purchases-list">
              {envios.map((e) => (
                <li key={e.id} className="purchase-item">
                  <div className="purchase-thumb">
                    <img src={resolveImage(e.image) || placeholder} alt="" />
                  </div>
                  <div className="purchase-meta">
                    <div className="title">Orden #{e.pedido_id} {e.nombre_diseno ? `· ${e.nombre_diseno}` : ''}</div>
                    <div className="sub">{new Date(e.creado_en).toLocaleString()}</div>
                    <div className="sub">{e.metodo === 'retiro' ? 'Retiro en tienda' : 'Despacho a domicilio'}</div>
                    {e.direccion && (
                      <div className="sub">{`${e.direccion}${e.comuna ? `, ${e.comuna}` : ''}${e.ciudad ? `, ${e.ciudad}` : ''}`}</div>
                    )}
                  </div>
                  <div className="purchase-side">
                    <div className="status-badge">{statusLabel(e.estado_envio)}</div>
                    {typeof e.costo_envio === 'number' && (
                      <div className="ship-cost">Envío: ${Number(e.costo_envio).toLocaleString('es-CL')}</div>
                    )}
                    <button className="btn" onClick={() => toggle(e.id)}>
                      {expanded[e.id] ? 'Ocultar seguimiento' : 'Ver seguimiento'}
                    </button>
                  </div>
                  {expanded[e.id] && (
                    <div className="purchase-track">
                      {/* Tracking code */}
                      {e.tracking ? (
                        <>
                          <div className="track-title">Código de seguimiento</div>
                          <div className="track-code">{e.tracking}</div>
                          {e.tracking_url && (
                            <div className="track-actions">
                              <a className="btn" href={e.tracking_url} target="_blank" rel="noreferrer">Abrir seguimiento</a>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="track-empty">Aún no hay código de seguimiento disponible.</div>
                      )}

                      {/* Timeline de estados (con próximos pasos) */}
                      <div className="track-timeline">
                        <div className="track-title" style={{ marginTop: 10 }}>Estado del envío</div>
                        {historial[e.id]?.loading && (
                          <div className="track-empty">Cargando historial…</div>
                        )}
                        {historial[e.id]?.error && (
                          <div className="track-empty" style={{ color: '#b91c1c' }}>{historial[e.id]?.error}</div>
                        )}
                        {(!historial[e.id]?.loading && !historial[e.id]?.error) && (() => {
                          // Pasos típicos del delivery
                          const BASE_STEPS = ['pendiente','preparando','despachado','en_transito','entregado'];
                          const CANCEL_STEPS = ['pendiente','cancelado'];
                          const steps = String(e.estado_envio).toLowerCase() === 'cancelado' ? CANCEL_STEPS : BASE_STEPS;
                          const Icon = ({ type }) => {
                            const common = { width: 14, height: 14, viewBox: '0 0 24 24', stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
                            switch (type) {
                              case 'pendiente': // check-circle outline for completed pending
                                return (
                                  <svg {...common}>
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                  </svg>
                                );
                              case 'preparando': // user
                                return (
                                  <svg {...common}>
                                    <path d="M20 21a8 8 0 1 0-16 0"/>
                                    <circle cx="12" cy="7" r="4"/>
                                  </svg>
                                );
                              case 'despachado': // truck
                                return (
                                  <svg {...common}>
                                    <rect x="1" y="3" width="15" height="13" rx="2"/>
                                    <path d="M16 8h5l2 3v5h-4"/>
                                    <circle cx="5.5" cy="19.5" r="2"/>
                                    <circle cx="18.5" cy="19.5" r="2"/>
                                  </svg>
                                );
                              case 'en_transito': // box
                                return (
                                  <svg {...common}>
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4.05a2 2 0 0 0 2 0l7-4.05A2 2 0 0 0 21 16z"/>
                                    <path d="M3.27 7L12 12l8.73-5"/>
                                  </svg>
                                );
                              case 'entregado': // flag
                                return (
                                  <svg {...common}>
                                    <path d="M4 22V2"/>
                                    <path d="M4 4h11l-1 4 3 1-2 5H4"/>
                                  </svg>
                                );
                              case 'cancelado': // x-circle
                                return (
                                  <svg {...common}>
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M15 9l-6 6M9 9l6 6"/>
                                  </svg>
                                );
                              default:
                                return (
                                  <svg {...common}><circle cx="12" cy="12" r="10"/></svg>
                                );
                            }
                          };
                          // Mapear eventos por estado -> fecha
                          const events = (historial[e.id]?.items || []).reduce((acc, ev) => {
                            const key = String(ev.estado || '').toLowerCase();
                            if (key && acc[key] == null) acc[key] = ev.creado_en || null;
                            return acc;
                          }, {});
                          // Determinar el índice alcanzado
                          const currentKey = String(e.estado_envio || 'pendiente').toLowerCase();
                          let reached = steps.findIndex(s => s === currentKey);
                          if (reached < 0) reached = 0;
                          return (
                            <ul className="timeline horizontal grid" style={{ ['--cols']: `repeat(${steps.length}, 1fr)` }}>
                              {steps.map((s, idx) => {
                                const when = events[s] || null;
                                const cls = idx < reached ? 'done' : idx === reached ? 'current' : 'upcoming';
                                const topLabel = idx < reached ? 'Completado' : (idx === reached ? 'En curso' : 'Próximo');
                                return (
                                  <li key={s} className={`timeline-item ${cls}`}>
                                    <span className="dot"><span className="ico"><Icon type={s} /></span></span>
                                    <div className="content">
                                      <div className="when">{topLabel}</div>
                                      <div className="what">{statusLabel(s)}</div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        })()}
                      {/* Reseña y calificación: solo cuando en curso o entregado */}
                      {['en_transito','entregado'].includes(String(e.estado_envio || '').toLowerCase()) && (
                        <div className="review-area" style={{ marginTop: 14 }}>
                          <h4>Deja tu calificación y reseña</h4>
                          <ReviewForm envioId={e.id} onSaved={() => {
                            // marcar como revisado localmente
                            setReviews((prev) => ({ ...prev, [e.id]: { ...prev[e.id], exists: true } }));
                          }} />
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisCompras;