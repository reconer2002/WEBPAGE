import React, { useEffect, useState } from "react";
// Importar componentes de Recharts (asumiendo que se instaló la librería)
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"; 
import { getEstadisticas } from "../../services/estadisticasService";
import { exportToCSV, exportToExcel, exportToPDF, printReport } from "../../utils/exportUtils";
import { FileDown, FileSpreadsheet, FileText, Printer } from "lucide-react";
import "./InformesEstadisticas.css";

// Colores para el gráfico circular (Roles)
const COLORS_ROLES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A239CA'];
// Colores para los gráficos de barras (Rankings)
const COLOR_GASTO = '#4CAF50'; 
const COLOR_PEDIDOS = '#2196F3';
const COLOR_DISENOS = '#FF5722';

// Función para formatear valores monetarios
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;
// Función para formatear conteos simples
const formatCount = (value) => `${parseInt(value)} uds.`;


// Componente auxiliar para mostrar el ranking como tabla
const RankingTable = ({ data, title, dataKey, valueFormatter, barColor }) => {
    if (!data || data.length === 0) return <p>No hay datos de ranking disponibles.</p>;

    // 💡 CORRECCIÓN DE ERROR Y ORDEN VISUAL:
    // 1. Copiamos el array para inmutabilidad ([...data]).
    // 2. Revertimos el orden (.reverse()) para que el #1 quede arriba en BarChart.
    const reversedData = [...data].reverse();

    return (
        <div className="ranking-panel">
            <h4>{title}</h4>
            <div className="ranking-content">
                <div className="ranking-chart">
                    {/* GRÁFICO DE BARRAS */}
                    <BarChart
                        width={400}
                        height={250}
                        data={reversedData} // Usamos el array inmutable y revertido
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={valueFormatter}/>
                        {/* El ranking #1 queda arriba gracias a reversedData */}
                        <YAxis dataKey="nombre" type="category" width={90} /> 
                        <Tooltip formatter={(value) => valueFormatter ? valueFormatter(value) : value} />
                        <Bar dataKey={dataKey} fill={barColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </div>
                <div className="ranking-table-list">
                    {/* RANKING EN FORMATO DE LISTA */}
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Usuario</th>
                                <th>{dataKey.replace('total', 'Total ')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* 💡 CORRECCIÓN: Usamos el array ORIGINAL (data) y el index + 1 para numerar, 
                                para que el #1 sea el primer elemento de la tabla. 
                                La tabla no necesita orden inverso si no es un BarChart vertical.
                            */}
                            {data.map((item, index) => (
                                <tr key={item.id}>
                                    {/* Numeración simple 1, 2, 3... */}
                                    <td>{index + 1}</td> 
                                    <td>{item.nombre}</td>
                                    <td>{valueFormatter ? valueFormatter(item[dataKey]) : item[dataKey]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


const InformesEstadisticas = () => {
  const [datos, setDatos] = useState({
    totalUsuarios: 0,
    totalPedidos: 0,
    usuariosPorRol: [],
    rankingDineroGastado: [],
    rankingMasPedidos: [],
    rankingMasDisenos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        setLoading(true);
        setError(null);
        // Función importada de '../../services/estadisticasService'
        const data = await getEstadisticas();
        setDatos(data);
      } catch (err) {
        console.error("Error cargando estadísticas:", err);
        setError("Error al cargar las estadísticas. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchEstadisticas();
  }, []);

  // Funciones de exportación
  const handleExport = async (format) => {
    setExporting(true);
    setExportMessage({ type: '', text: '' });

    try {
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `estadisticas_${timestamp}`;
      let success = false;

      switch (format) {
        case 'csv':
          success = exportToCSV(datos, filename);
          break;
        case 'excel':
          success = exportToExcel(datos, filename);
          break;
        case 'pdf':
          success = exportToPDF(datos, filename);
          break;
        case 'print':
          success = printReport(datos);
          break;
        default:
          success = false;
      }

      if (success) {
        setExportMessage({ 
          type: 'success', 
          text: format === 'print' ? 'Impresión iniciada' : `Informe exportado correctamente en formato ${format.toUpperCase()}` 
        });
      } else {
        setExportMessage({ 
          type: 'error', 
          text: 'Error al exportar el informe. Intenta de nuevo.' 
        });
      }
    } catch (err) {
      console.error('Error en la exportación:', err);
      setExportMessage({ 
        type: 'error', 
        text: 'Error al exportar el informe. Intenta de nuevo.' 
      });
    } finally {
      setExporting(false);
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => {
        setExportMessage({ type: '', text: '' });
      }, 5000);
    }
  };

  // Formatear datos de roles para PieChart (no necesita ser copiado, solo mapeado)
  const dataRoles = datos.usuariosPorRol.map(item => ({
    name: item.rol,
    value: item.cantidad
  }));

  return (
    <div className="informes-estadisticas-container">
      <div className="estadisticas-header">
        <h3>📊 Informes - Estadísticas</h3>
        
        {!loading && !error && (
          <div className="export-buttons">
            <button 
              className="export-btn export-csv"
              onClick={() => handleExport('csv')}
              disabled={exporting}
              title="Exportar a CSV"
            >
              <FileText size={18} />
              <span>CSV</span>
            </button>
            
            <button 
              className="export-btn export-excel"
              onClick={() => handleExport('excel')}
              disabled={exporting}
              title="Exportar a Excel"
            >
              <FileSpreadsheet size={18} />
              <span>Excel</span>
            </button>
            
            <button 
              className="export-btn export-pdf"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              title="Exportar a PDF"
            >
              <FileDown size={18} />
              <span>PDF</span>
            </button>
            
            <button 
              className="export-btn export-print"
              onClick={() => handleExport('print')}
              disabled={exporting}
              title="Imprimir"
            >
              <Printer size={18} />
              <span>Imprimir</span>
            </button>
          </div>
        )}
      </div>

      {exportMessage.text && (
        <div className={`export-message ${exportMessage.type}`}>
          {exportMessage.text}
        </div>
      )}

      {loading && <p>Cargando estadísticas...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* SECCIÓN 1: RESUMEN DE NÚMEROS */}
          <div className="estadisticas-resumen">
            <div className="resumen-card">
              <h4>Total de Usuarios</h4>
              <p className="big-number">{datos.totalUsuarios.toLocaleString()}</p>
            </div>
            
            <div className="resumen-card">
              <h4>Total de Pedidos</h4>
              <p className="big-number">{datos.totalPedidos.toLocaleString()}</p>
            </div>
          </div>
          
          <hr />

          {/* SECCIÓN 2: GRÁFICO CIRCULAR DE ROLES */}
          <div className="estadisticas-graficos-pie">
            <h4>Usuarios por Rol</h4>
            <PieChart width={450} height={350}>
              <Pie
                data={dataRoles}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {dataRoles.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_ROLES[index % COLORS_ROLES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} ${value === 1 ? 'usuario' : 'usuarios'}`, name]}/>
              <Legend layout="horizontal" align="center" verticalAlign="bottom"/>
            </PieChart>
          </div>
          
          <hr />
          
          {/* SECCIÓN 3: RANKINGS DE USUARIOS */}
          <h2>🏆 Rankings de Usuarios (Top 10)</h2>
          <div className="estadisticas-rankings">
            
            <RankingTable
                data={datos.rankingDineroGastado}
                title="Usuarios con más dinero gastado"
                dataKey="totalGastado"
                valueFormatter={formatCurrency}
                barColor={COLOR_GASTO}
            />

            <RankingTable
                data={datos.rankingMasPedidos}
                title="Usuarios con más pedidos hechos"
                dataKey="totalPedidos"
                valueFormatter={formatCount}
                barColor={COLOR_PEDIDOS}
            />

            <RankingTable
                data={datos.rankingMasDisenos}
                title="Usuarios con más diseños generados"
                dataKey="totalDisenos"
                valueFormatter={formatCount}
                barColor={COLOR_DISENOS}
            />

          </div>
        </>
      )}
    </div>
  );
};

export default InformesEstadisticas;