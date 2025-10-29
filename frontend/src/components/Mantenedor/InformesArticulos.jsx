import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"; 
import { getArticulosEstadisticas, getDisenosPorVariante } from "../../services/estadisticasService";
import "./InformesArticulos.css";

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

// Componente auxiliar para el gráfico circular (sin cambios)
const VarianteDesignsPieChart = ({ data, categoryName }) => {
  // ... (código VarianteDesignsPieChart anterior)
  const chartData = data
    .filter(item => item.nombre_categoria === categoryName)
    .map(item => ({
      name: item.valor,
      value: item.total_disenos
    }));

  const totalDesigns = chartData.reduce((sum, item) => sum + item.value, 0);

  if (totalDesigns === 0) {
    return <p>No hay diseños generados para esta categoría.</p>;
  }

  return (
    <div className="variantes-chart-container">
      <h4>Distribución por Categoría: {categoryName}</h4>
      <p>Total de Diseños Únicos en {categoryName}: {totalDesigns}</p>
      <PieChart width={450} height={350}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          fill="#8884d8"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ paddingLeft: '20px' }}/>
      </PieChart>
    </div>
  );
};


const InformesArticulos = () => {
  const [resumen, setResumen] = useState({
    totalArticulos: 0,
    totalVariantes: 0,
    totalDisenos: 0,
    listaArticulos: [],
    rankingTopArticulos: []
  });
  const [loading, setLoading] = useState(true);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [disenosVariantes, setDisenosVariantes] = useState([]);
  const [loadingVariantes, setLoadingVariantes] = useState(false);
  const [categoriasUnicas, setCategoriasUnicas] = useState([]);


  // Cargar resumen y lista de artículos
  useEffect(() => {
    const fetchResumen = async () => {
      try {
        setLoading(true);
  const data = await getArticulosEstadisticas(); 
  // Asegurar campo rankingTopArticulos
  data.rankingTopArticulos = data.rankingTopArticulos || [];
  setResumen(data);
      } catch (err) {
        console.error("Error cargando resumen de artículos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResumen();
  }, []);

  // Cargar diseños por variante al seleccionar un artículo
  useEffect(() => {
    if (articuloSeleccionado) {
      const fetchVariantes = async () => {
        try {
          setLoadingVariantes(true);
          const data = await getDisenosPorVariante(articuloSeleccionado.id);
          setDisenosVariantes(data);
          
          const uniqueCategories = [...new Set(data.map(item => item.nombre_categoria))];
          setCategoriasUnicas(uniqueCategories);
          
        } catch (err) {
          console.error("Error cargando variantes de diseño:", err);
          setDisenosVariantes([]);
          setCategoriasUnicas([]); 
        } finally {
          setLoadingVariantes(false);
        }
      };
      fetchVariantes();
    } else {
      setDisenosVariantes([]);
      setCategoriasUnicas([]);
    }
  }, [articuloSeleccionado]);


  const handleClickArticulo = (art) => {
    setArticuloSeleccionado(art);
  };

  const handleCerrar = () => {
    setArticuloSeleccionado(null);
  };

  if (loading) return <p>Cargando informes de artículos...</p>;

  return (
    <div className="informes-articulos-container">
      <h3>📈 Informes - Artículos y Diseños</h3>

      {/* SECCIÓN RESUMEN (sin cambios) */}
      <div className="estadisticas-resumen">
        <div className="resumen-card">
          <h4>Total Artículos</h4>
          <p className="big-number">{resumen.totalArticulos.toLocaleString()}</p>
        </div>
        <div className="resumen-card">
          <h4>Total Variantes</h4>
          <p className="big-number">{resumen.totalVariantes.toLocaleString()}</p>
        </div>
        <div className="resumen-card">
          <h4>Total Diseños (Activos + Comprados)</h4>
          <p className="big-number">{resumen.totalDisenos.toLocaleString()}</p>
        </div>
      </div>

      <hr />

      <section style={{ marginBottom: 18 }}>
        <h4>Top artículos por calificación</h4>
        {resumen.rankingTopArticulos && resumen.rankingTopArticulos.length > 0 ? (
          <div className="top-articulos-list">
            {resumen.rankingTopArticulos.map((a, idx) => (
              <div key={a.articulo_id} className="top-articulo-card">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64 }}>
                    {a.foto && <img src={a.foto} alt={a.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{idx + 1}. {a.nombre}</div>
                    <div style={{ color: '#6b7280' }}>{a.reviews_count} reseñas · {a.avg_stars} ★</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay reseñas por artículo aún.</p>
        )}
      </section>

      <section className="grid-contenido">
        {/* GRID DE ARTÍCULOS (Mostrador) - Tarjeta General */}
        <div className={`mostrador ${articuloSeleccionado ? "reducido" : "completo"}`}>
            {/* 💡 TÍTULO CENTRADO Y FIJO DENTRO DE LA TARJETA GENERAL */}
            <h4 className="mostrador-titulo-instruccion">
                Selecciona un Artículo para ver sus estadísticas
            </h4>
            
            <div className="articulos-grid-scroll"> {/* Nuevo div para controlar el scroll del grid */}
                <div className="articulos-grid">
                    {resumen.listaArticulos.length === 0 && <p>No hay artículos para informar.</p>}

                    {resumen.listaArticulos.map((art) => (
                      <div
                        key={art.id}
                        className="item-articulo"
                        onClick={() => handleClickArticulo(art)}
                        style={{
                          border:
                            articuloSeleccionado && articuloSeleccionado.id === art.id
                              ? "2px solid #007bff"
                              : "1px solid #ddd",
                        }}
                      >
                        <div className="contenedor-foto">
                          {art.foto && <img src={art.foto} alt={art.nombre} />}
                        </div>
                        <p className="nombre-articulo">{art.nombre}</p>
                        <span className="precio-articulo">${art.precio}</span>
                      </div>
                    ))}
                </div>
            </div>
        </div>

        {/* PANEL LATERAL DE DETALLE Y GRÁFICO (Seleccion) */}
        <div className={`seleccion ${articuloSeleccionado ? "abierto" : "cerrado"}`}>
          {articuloSeleccionado && (
            <div className="contenido">
              <div className="cerrar" onClick={handleCerrar}>
                &#x2715;
              </div>
              <h3>Estadísticas de {articuloSeleccionado.nombre}</h3>
              
              {loadingVariantes ? (
                <p>Cargando información de variantes...</p>
              ) : (
                <div className="charts-container">
                  {/* GENERAR GRÁFICO POR CADA CATEGORÍA ÚNICA */}
                  {categoriasUnicas.map(category => (
                    <VarianteDesignsPieChart 
                      key={category} 
                      data={disenosVariantes} 
                      categoryName={category} 
                    />
                  ))}
                  
                  {categoriasUnicas.length === 0 && (
                    <p>El artículo no tiene variantes definidas o no hay diseños asociados.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default InformesArticulos;