import React, { useEffect, useState } from 'react';
import pedidosService from '../../services/pedidosService';
import enviosService from '../../services/enviosService';
import './ProductosArticulos.css';

const ESTADOS = ['pendiente', 'pagado', 'rechazado', 'cancelado'];
const DELIVERY_ESTADOS = ['pendiente', 'preparando', 'despachado', 'en_transito', 'entregado', 'cancelado'];

const PedidosGestion = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const list = await pedidosService.list({ estado: filtroEstado || undefined, usuario_id: filtroUsuario || undefined });
      setItems(list || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'No se pudieron cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onFiltrar = (e) => { e.preventDefault(); load(); };

  const onEstadoChange = (id, estado) => {
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, estado } : p));
  };

  const onSaveRow = async (id) => {
    const pedido = items.find(p => p.id === id);
    if (!pedido) return;
    try {
      setSavingId(id);
      // Guardar estado del pedido
      await pedidosService.update(id, { estado: pedido.estado });
      // Guardar estado de envío si corresponde
      if (pedido.envio_id) {
        await enviosService.updateEnvio(pedido.envio_id, { estado_envio: pedido.estado_envio || 'pendiente' });
      }
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'No se pudo guardar los cambios');
    } finally {
      setSavingId(null);
    }
  };

  // Delivery (envíos)
  const onDeliveryChange = (pedidoId, estado_envio) => {
    setItems((prev) => prev.map((p) => p.id === pedidoId ? { ...p, estado_envio } : p));
  };

  // onDeliverySave eliminado: se guarda junto con el estado del pedido en onSaveRow

  return (
    <div className="productos-container">
      <h2>Gestión de pedidos</h2>
      <form onSubmit={onFiltrar} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Estado</span>
          <select value={filtroEstado} onChange={(e)=>setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>ID Usuario</span>
          <input value={filtroUsuario} onChange={(e)=>setFiltroUsuario(e.target.value)} placeholder="Ej: 1" />
        </label>
        <button className="btn" type="submit">Filtrar</button>
      </form>

      {loading ? <p>Cargando pedidos…</p> : error ? <p style={{ color: '#b91c1c' }}>{error}</p> : (
        <table className="tabla-articulos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Envios</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id}>
                <td>#{it.id}</td>
                <td>{it.usuario_nombre} (#{it.usuario_id})</td>
                <td>{it.usuario_email}</td>
                <td>{new Date(it.fecha).toLocaleString()}</td>
                <td>${Number(it.costo||0).toLocaleString('es-CL')}</td>
                <td>
                  <select value={it.estado} onChange={(e)=>onEstadoChange(it.id, e.target.value)} disabled={savingId===it.id}>
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                  <td>
                  {it.envio_id ? (
                    <div style={{ display: 'grid', gap: 6 }}>
                      <small style={{ color: '#64748b' }}>Método: {it.envio_metodo || '-'}</small>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select value={it.estado_envio || 'pendiente'} onChange={(e)=>onDeliveryChange(it.id, e.target.value)} disabled={savingId===it.id}>
                          {DELIVERY_ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      {/* Mostrar reseña si existe */}
                      {typeof it.envio_estrellas !== 'undefined' && it.envio_estrellas !== null && (
                        <div style={{ marginTop: 8, padding: 8, background: '#fff8e6', borderRadius: 6 }}>
                          <div style={{ color: '#92400e', fontWeight: 600, marginBottom: 4 }}>Reseña del usuario</div>
                          <div style={{ color: '#f59e0b', fontSize: 16, marginBottom: 6 }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{i < Number(it.envio_estrellas) ? '★' : '☆'}</span>
                            ))}
                            <span style={{ marginLeft: 8, color: '#374151', fontWeight: 600 }}>{it.envio_estrellas}/5</span>
                          </div>
                          {it.envio_comentario ? (
                            <div style={{ color: '#374151', fontSize: 14 }}>{it.envio_comentario}</div>
                          ) : (
                            <div style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic' }}>Sin comentario</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td><button className="btn" onClick={()=>onSaveRow(it.id)} disabled={savingId===it.id}>Guardar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PedidosGestion;