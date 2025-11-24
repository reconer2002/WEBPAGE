import React, { useEffect, useState } from 'react';
import pedidosService from '../../services/pedidosService';
import enviosService from '../../services/enviosService';
import { exportarDisenosPedidoAPDF } from '../../utils/pdfExportUtils';
import './PedidosGestion.css';

const ESTADOS = ['pendiente', 'pagado', 'rechazado', 'cancelado'];
const DELIVERY_ESTADOS = ['pendiente', 'preparando', 'despachado', 'en_transito', 'entregado', 'cancelado'];

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  preparando: 'Preparando',
  despachado: 'Despachado',
  en_transito: 'En tránsito',
  entregado: 'Entregado',
  retiro: 'Retiro',
  delivery: 'Despacho'
};

const PedidosGestion = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [exportingId, setExportingId] = useState(null);

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

  const descargarDocumento = async (pedidoId, tipo) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/documentos/${tipo}/${pedidoId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar el documento');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${tipo}_${pedidoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (e) {
      alert(e?.message || 'Error al descargar el documento');
    }
  };

  const exportarDisenosPDF = async (pedidoId) => {
    try {
      setExportingId(pedidoId);
      // Obtener detalles del pedido con diseños
      const detalles = await pedidosService.getDetalles(pedidoId);
      
      if (!detalles || detalles.length === 0) {
        alert('Este pedido no tiene diseños para exportar');
        return;
      }

      // Exportar a PDF
      await exportarDisenosPedidoAPDF(detalles, pedidoId);
    } catch (e) {
      console.error('Error al exportar diseños:', e);
      alert(e?.message || 'Error al exportar diseños a PDF');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="pedidos-container">
      <div className="pedidos-header">
        <div className="pedidos-title-section">
          <h2>Gestión de pedidos</h2>
          <p className="pedidos-subtitle">Administra y monitorea todos los pedidos del sistema</p>
        </div>
      </div>

      <div className="filtros-card">
        <h3>Filtros de búsqueda</h3>
        <form onSubmit={onFiltrar} className="filtros-form">
          <div className="filtro-group">
            <label>Estado del pedido</label>
            <select value={filtroEstado} onChange={(e)=>setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABELS[s] || s}</option>)}
            </select>
          </div>
          <div className="filtro-group">
            <label>ID de usuario</label>
            <input 
              type="number" 
              value={filtroUsuario} 
              onChange={(e)=>setFiltroUsuario(e.target.value)} 
              placeholder="Ingresa el ID del usuario" 
            />
          </div>
          <button className="btn-filtrar" type="submit">Aplicar filtros</button>
        </form>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No se encontraron pedidos con los filtros aplicados</p>
        </div>
      ) : (
        <div className="pedidos-table-container">
          <table className="pedidos-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado Pedido</th>
                <th>Envío</th>
                <th>Documento</th>
                <th>Diseños</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td className="pedido-id">#{it.id}</td>
                  <td>
                    <div className="usuario-info">
                      <span className="usuario-nombre">{it.usuario_nombre}</span>
                      <span className="usuario-id">ID: {it.usuario_id}</span>
                      <span className="usuario-email">{it.usuario_email}</span>
                    </div>
                  </td>
                  <td className="pedido-fecha">
                    {new Date(it.fecha).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="pedido-total">${Number(it.costo||0).toLocaleString('es-CL')}</td>
                  <td>
                    <select 
                      className="estado-select" 
                      value={it.estado} 
                      onChange={(e)=>onEstadoChange(it.id, e.target.value)} 
                      disabled={savingId===it.id}
                    >
                      {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABELS[s] || s}</option>)}
                    </select>
                  </td>
                  <td>
                    {it.envio_id ? (
                      <div className="envio-info">
                        <span className="envio-metodo">
                          {ESTADO_LABELS[it.envio_metodo] || it.envio_metodo || 'Despacho'}
                        </span>
                        <select 
                          className="envio-estado-select" 
                          value={it.estado_envio || 'pendiente'} 
                          onChange={(e)=>onDeliveryChange(it.id, e.target.value)} 
                          disabled={savingId===it.id}
                        >
                          {DELIVERY_ESTADOS.map(s => <option key={s} value={s}>{ESTADO_LABELS[s] || s}</option>)}
                        </select>
                      </div>
                    ) : (
                      <span className="no-envio">Sin envío</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {it.tipo_documento === 'boleta' && (
                        <button 
                          className="btn-documento" 
                          onClick={() => descargarDocumento(it.id, 'boleta')}
                          title="Descargar Boleta"
                        >
                          📄 Boleta
                        </button>
                      )}
                      {it.tipo_documento === 'factura' && (
                        <button 
                          className="btn-documento" 
                          onClick={() => descargarDocumento(it.id, 'factura')}
                          title="Descargar Factura"
                        >
                          📋 Factura
                        </button>
                      )}
                      {!it.tipo_documento && (
                        <span className="no-documento">Sin documento</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn-exportar" 
                      onClick={() => exportarDisenosPDF(it.id)} 
                      disabled={exportingId === it.id}
                      title="Exportar diseños a PDF"
                    >
                      {exportingId === it.id ? '⏳ Exportando...' : '📥 Exportar'}
                    </button>
                  </td>
                  <td>
                    <button 
                      className="btn-guardar" 
                      onClick={()=>onSaveRow(it.id)} 
                      disabled={savingId===it.id}
                    >
                      {savingId===it.id ? 'Guardando...' : 'Guardar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PedidosGestion;