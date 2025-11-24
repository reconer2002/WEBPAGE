import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { getRankingProductos, getDetalleProducto } from "../../services/estadisticasService";
import "./InformesArticulos.css";

const InformesArticulos = () => {
  const [datosRanking, setDatosRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [detalleProducto, setDetalleProducto] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [vistaActual, setVistaActual] = useState('masVendidos'); // 'masVendidos' o 'sinVentas'

  // Cargar ranking inicial
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const data = await getRankingProductos();
        setDatosRanking(data);
      } catch (err) {
        console.error("Error cargando ranking de productos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  // Cargar detalle del producto seleccionado
  useEffect(() => {
    if (productoSeleccionado) {
      const fetchDetalle = async () => {
        try {
          setLoadingDetalle(true);
          const data = await getDetalleProducto(productoSeleccionado.id);
          setDetalleProducto(data);
        } catch (err) {
          console.error("Error cargando detalle del producto:", err);
          setDetalleProducto(null);
        } finally {
          setLoadingDetalle(false);
        }
      };
      fetchDetalle();
    } else {
      setDetalleProducto(null);
    }
  }, [productoSeleccionado]);

  const handleClickProducto = (producto) => {
    setProductoSeleccionado(producto);
  };

  const handleCerrar = () => {
    setProductoSeleccionado(null);
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  if (loading) return <div className="loading-state"><p>Cargando ranking de productos...</p></div>;

  const productosAMostrar = vistaActual === 'masVendidos' 
    ? datosRanking?.rankingVentas || []
    : datosRanking?.productosSinVentas || [];

  return (
    <div className="informes-articulos-container">
      <h3>🏆 Ranking de Productos</h3>

      {/* MÉTRICAS GENERALES */}
      <div className="estadisticas-resumen">
        <div className="resumen-card">
          <h4>Productos Vendidos</h4>
          <p className="big-number">{datosRanking?.metricas?.total_productos_vendidos?.toLocaleString() || 0}</p>
        </div>
        <div className="resumen-card">
          <h4>Ingresos Totales</h4>
          <p className="big-number">{formatearMoneda(datosRanking?.metricas?.ingresos_totales_global)}</p>
        </div>
        <div className="resumen-card">
          <h4>Pedidos Completados</h4>
          <p className="big-number">{datosRanking?.metricas?.total_pedidos_completados?.toLocaleString() || 0}</p>
        </div>
        <div className="resumen-card">
          <h4>Clientes Únicos</h4>
          <p className="big-number">{datosRanking?.metricas?.total_clientes?.toLocaleString() || 0}</p>
        </div>
      </div>

      <hr />

      {/* SELECTOR DE VISTA */}
      <div className="vista-selector">
        <button 
          className={vistaActual === 'masVendidos' ? 'active' : ''}
          onClick={() => setVistaActual('masVendidos')}
        >
          📊 Más Vendidos ({datosRanking?.rankingVentas?.length || 0})
        </button>
        <button 
          className={vistaActual === 'sinVentas' ? 'active' : ''}
          onClick={() => setVistaActual('sinVentas')}
        >
          ⚠️ Sin Ventas ({datosRanking?.productosSinVentas?.length || 0})
        </button>
      </div>

      <section className="grid-contenido">
        {/* TABLA DE RANKING */}
        <div className={`mostrador ${productoSeleccionado ? "reducido" : "completo"}`}>
          <h4 className="mostrador-titulo-instruccion">
            {vistaActual === 'masVendidos' 
              ? 'Haz clic en un producto para ver sus métricas detalladas' 
              : 'Productos sin ventas registradas'}
          </h4>
          
          <div className="ranking-table-container">
            {productosAMostrar.length === 0 ? (
              <p className="empty-message">No hay productos en esta categoría.</p>
            ) : (
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th>Precio</th>
                    {vistaActual === 'masVendidos' && (
                      <>
                        <th>Unidades Vendidas</th>
                        <th>Ingresos</th>
                        <th>Pedidos</th>
                        <th>Clientes</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {productosAMostrar.map((producto, index) => (
                    <tr 
                      key={producto.id}
                      onClick={() => vistaActual === 'masVendidos' && handleClickProducto(producto)}
                      className={vistaActual === 'masVendidos' ? 'clickable' : ''}
                      style={{
                        backgroundColor: productoSeleccionado?.id === producto.id ? '#e3f2fd' : 'transparent'
                      }}
                    >
                      <td className="ranking-position">{index + 1}</td>
                      <td className="producto-info">
                        <div className="producto-cell">
                          {producto.foto && (
                            <img src={producto.foto} alt={producto.variantes} className="producto-mini-img" />
                          )}
                          <div className="producto-text">
                            <span className="nombre-objeto">{producto.nombre_articulo}</span>
                            <span className="nombre-articulo-sub">{producto.variantes}</span>
                          </div>
                        </div>
                      </td>
                      <td>{formatearMoneda(producto.precio)}</td>
                      {vistaActual === 'masVendidos' && (
                        <>
                          <td className="metric-cell">{producto.total_unidades_vendidas?.toLocaleString()}</td>
                          <td className="metric-cell highlight">{formatearMoneda(producto.ingresos_totales)}</td>
                          <td className="metric-cell">{producto.total_pedidos?.toLocaleString()}</td>
                          <td className="metric-cell">{producto.clientes_unicos?.toLocaleString()}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* PANEL LATERAL DE DETALLE */}
        <div className={`seleccion ${productoSeleccionado ? "abierto" : "cerrado"}`}>
          {productoSeleccionado && (
            <div className="contenido">
              <div className="cerrar" onClick={handleCerrar}>
                &#x2715;
              </div>
              
              <div className="detalle-header">
                {productoSeleccionado.foto && (
                  <img src={productoSeleccionado.foto} alt={productoSeleccionado.variantes} className="producto-detalle-img" />
                )}
                <h3>{productoSeleccionado.nombre_articulo}</h3>
                <p className="producto-articulo">{productoSeleccionado.variantes}</p>
                <p className="producto-precio">{formatearMoneda(productoSeleccionado.precio)}</p>
              </div>

              {loadingDetalle ? (
                <p>Cargando métricas...</p>
              ) : detalleProducto ? (
                <div className="detalle-metricas">
                  {/* MÉTRICAS CLAVE */}
                  <div className="metricas-grid">
                    <div className="metrica-card">
                      <span className="metrica-label">Unidades Vendidas</span>
                      <span className="metrica-valor">{detalleProducto.metricas.unidades_vendidas?.toLocaleString()}</span>
                    </div>
                    <div className="metrica-card">
                      <span className="metrica-label">Ingresos Totales</span>
                      <span className="metrica-valor destacado">{formatearMoneda(detalleProducto.metricas.ingresos_totales)}</span>
                    </div>
                    <div className="metrica-card">
                      <span className="metrica-label">Pedidos</span>
                      <span className="metrica-valor">{detalleProducto.metricas.pedidos_totales?.toLocaleString()}</span>
                    </div>
                    <div className="metrica-card">
                      <span className="metrica-label">Clientes Únicos</span>
                      <span className="metrica-valor">{detalleProducto.metricas.clientes_unicos?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* GRÁFICO DE VENTAS POR MES */}
                  {detalleProducto.ventasPorMes && detalleProducto.ventasPorMes.length > 0 && (
                    <div className="chart-section">
                      <h4>📈 Ventas por Mes (Últimos 6 meses)</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={[...detalleProducto.ventasPorMes].reverse()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="unidades_vendidas" stroke="#8884d8" name="Unidades" />
                          <Line yAxisId="right" type="monotone" dataKey="ingresos" stroke="#82ca9d" name="Ingresos" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* TOP CLIENTES */}
                  {detalleProducto.topClientes && detalleProducto.topClientes.length > 0 && (
                    <div className="top-clientes-section">
                      <h4>👥 Top Clientes</h4>
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>Cantidad</th>
                            <th>Total Gastado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalleProducto.topClientes.map((cliente, index) => (
                            <tr key={index}>
                              <td>{cliente.nombre}</td>
                              <td>{cliente.cantidad_comprada}</td>
                              <td>{formatearMoneda(cliente.total_gastado)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <p>No se pudieron cargar los detalles del producto.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default InformesArticulos;