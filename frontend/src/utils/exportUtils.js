// Utilidades para exportar datos en diferentes formatos
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Formatea valores monetarios
 */
const formatCurrency = (value) => {
  return `$${parseFloat(value).toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;
};

/**
 * Formatea conteos simples
 */
const formatCount = (value) => {
  return `${parseInt(value)}`;
};

/**
 * Exporta datos a formato CSV
 * @param {Object} datos - Objeto con todas las estadísticas
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export const exportToCSV = (datos, filename = 'estadisticas') => {
  try {
    let csvContent = '';

    // Sección 1: Resumen General
    csvContent += 'RESUMEN GENERAL\n';
    csvContent += `Total de Usuarios,${datos.totalUsuarios}\n`;
    csvContent += `Total de Pedidos,${datos.totalPedidos}\n`;
    csvContent += '\n';

    // Sección 2: Usuarios por Rol
    csvContent += 'USUARIOS POR ROL\n';
    csvContent += 'Rol,Cantidad\n';
    datos.usuariosPorRol.forEach(item => {
      csvContent += `${item.rol},${item.cantidad}\n`;
    });
    csvContent += '\n';

    // Sección 3: Ranking de Dinero Gastado
    csvContent += 'RANKING - DINERO GASTADO (TOP 10)\n';
    csvContent += 'Posición,Usuario,Total Gastado\n';
    datos.rankingDineroGastado.forEach((item, index) => {
      csvContent += `${index + 1},${item.nombre},${item.totalGastado}\n`;
    });
    csvContent += '\n';

    // Sección 4: Ranking de Pedidos
    csvContent += 'RANKING - MÁS PEDIDOS (TOP 10)\n';
    csvContent += 'Posición,Usuario,Total Pedidos\n';
    datos.rankingMasPedidos.forEach((item, index) => {
      csvContent += `${index + 1},${item.nombre},${item.totalPedidos}\n`;
    });
    csvContent += '\n';

    // Sección 5: Ranking de Diseños
    csvContent += 'RANKING - MÁS DISEÑOS (TOP 10)\n';
    csvContent += 'Posición,Usuario,Total Diseños\n';
    datos.rankingMasDisenos.forEach((item, index) => {
      csvContent += `${index + 1},${item.nombre},${item.totalDisenos}\n`;
    });

    // Crear blob y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error exportando a CSV:', error);
    return false;
  }
};

/**
 * Exporta datos a formato Excel (XLSX)
 * @param {Object} datos - Objeto con todas las estadísticas
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export const exportToExcel = (datos, filename = 'estadisticas') => {
  try {
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Resumen General
    const resumenData = [
      ['RESUMEN GENERAL'],
      [],
      ['Métrica', 'Valor'],
      ['Total de Usuarios', datos.totalUsuarios],
      ['Total de Pedidos', datos.totalPedidos],
    ];
    const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

    // Hoja 2: Usuarios por Rol
    const rolesData = [
      ['USUARIOS POR ROL'],
      [],
      ['Rol', 'Cantidad'],
      ...datos.usuariosPorRol.map(item => [item.rol, item.cantidad])
    ];
    const rolesSheet = XLSX.utils.aoa_to_sheet(rolesData);
    XLSX.utils.book_append_sheet(workbook, rolesSheet, 'Usuarios por Rol');

    // Hoja 3: Ranking Dinero Gastado
    const dineroData = [
      ['RANKING - DINERO GASTADO (TOP 10)'],
      [],
      ['Posición', 'Usuario', 'Total Gastado'],
      ...datos.rankingDineroGastado.map((item, index) => [
        index + 1,
        item.nombre,
        parseFloat(item.totalGastado)
      ])
    ];
    const dineroSheet = XLSX.utils.aoa_to_sheet(dineroData);
    XLSX.utils.book_append_sheet(workbook, dineroSheet, 'Ranking Dinero');

    // Hoja 4: Ranking Pedidos
    const pedidosData = [
      ['RANKING - MÁS PEDIDOS (TOP 10)'],
      [],
      ['Posición', 'Usuario', 'Total Pedidos'],
      ...datos.rankingMasPedidos.map((item, index) => [
        index + 1,
        item.nombre,
        parseInt(item.totalPedidos)
      ])
    ];
    const pedidosSheet = XLSX.utils.aoa_to_sheet(pedidosData);
    XLSX.utils.book_append_sheet(workbook, pedidosSheet, 'Ranking Pedidos');

    // Hoja 5: Ranking Diseños
    const disenosData = [
      ['RANKING - MÁS DISEÑOS (TOP 10)'],
      [],
      ['Posición', 'Usuario', 'Total Diseños'],
      ...datos.rankingMasDisenos.map((item, index) => [
        index + 1,
        item.nombre,
        parseInt(item.totalDisenos)
      ])
    ];
    const disenosSheet = XLSX.utils.aoa_to_sheet(disenosData);
    XLSX.utils.book_append_sheet(workbook, disenosSheet, 'Ranking Diseños');

    // Descargar archivo
    XLSX.writeFile(workbook, `${filename}.xlsx`);

    return true;
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    return false;
  }
};

/**
 * Exporta datos a formato PDF
 * @param {Object} datos - Objeto con todas las estadísticas
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export const exportToPDF = (datos, filename = 'estadisticas') => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Función auxiliar para verificar si necesitamos nueva página
    const checkNewPage = (heightNeeded) => {
      if (currentY + heightNeeded > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
        return true;
      }
      return false;
    };

    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(0, 106, 113); // Color primario
    doc.text('Informe de Estadísticas', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Fecha y hora de generación
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const now = new Date();
    const fechaHora = `Generado el: ${now.toLocaleDateString('es-CL')} a las ${now.toLocaleTimeString('es-CL')}`;
    doc.text(fechaHora, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Sección 1: Resumen General
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen General', 14, currentY);
    currentY += 10;

    doc.autoTable({
      startY: currentY,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Usuarios', datos.totalUsuarios.toLocaleString()],
        ['Total de Pedidos', datos.totalPedidos.toLocaleString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 106, 113] },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 15;

    // Sección 2: Usuarios por Rol
    checkNewPage(60);
    doc.setFontSize(14);
    doc.text('Usuarios por Rol', 14, currentY);
    currentY += 10;

    doc.autoTable({
      startY: currentY,
      head: [['Rol', 'Cantidad', 'Porcentaje']],
      body: datos.usuariosPorRol.map(item => {
        const porcentaje = ((item.cantidad / datos.totalUsuarios) * 100).toFixed(1);
        return [item.rol, item.cantidad, `${porcentaje}%`];
      }),
      theme: 'striped',
      headStyles: { fillColor: [0, 106, 113] },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 15;

    // Sección 3: Ranking Dinero Gastado
    checkNewPage(100);
    doc.setFontSize(14);
    doc.text('Ranking - Dinero Gastado (Top 10)', 14, currentY);
    currentY += 10;

    doc.autoTable({
      startY: currentY,
      head: [['#', 'Usuario', 'Total Gastado']],
      body: datos.rankingDineroGastado.map((item, index) => [
        index + 1,
        item.nombre,
        formatCurrency(item.totalGastado)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [76, 175, 80] },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 15;

    // Sección 4: Ranking Más Pedidos
    checkNewPage(100);
    doc.setFontSize(14);
    doc.text('Ranking - Más Pedidos (Top 10)', 14, currentY);
    currentY += 10;

    doc.autoTable({
      startY: currentY,
      head: [['#', 'Usuario', 'Total Pedidos']],
      body: datos.rankingMasPedidos.map((item, index) => [
        index + 1,
        item.nombre,
        formatCount(item.totalPedidos)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 15;

    // Sección 5: Ranking Más Diseños
    checkNewPage(100);
    doc.setFontSize(14);
    doc.text('Ranking - Más Diseños (Top 10)', 14, currentY);
    currentY += 10;

    doc.autoTable({
      startY: currentY,
      head: [['#', 'Usuario', 'Total Diseños']],
      body: datos.rankingMasDisenos.map((item, index) => [
        index + 1,
        item.nombre,
        formatCount(item.totalDisenos)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [255, 87, 34] },
      margin: { left: 14, right: 14 },
    });

    // Pie de página en todas las páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Guardar PDF
    doc.save(`${filename}.pdf`);

    return true;
  } catch (error) {
    console.error('Error exportando a PDF:', error);
    return false;
  }
};

/**
 * Imprime el informe directamente
 * @param {Object} datos - Objeto con todas las estadísticas
 */
export const printReport = (datos) => {
  try {
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe de Estadísticas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          h1 {
            color: #006a71;
            text-align: center;
            margin-bottom: 10px;
          }
          .fecha {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-bottom: 30px;
          }
          h2 {
            color: #006a71;
            border-bottom: 2px solid #006a71;
            padding-bottom: 5px;
            margin-top: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th {
            background-color: #006a71;
            color: white;
            padding: 10px;
            text-align: left;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .resumen-card {
            display: inline-block;
            width: 45%;
            margin: 10px 2%;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          .resumen-card h3 {
            margin: 0 0 10px 0;
            color: #006a71;
          }
          .resumen-card .valor {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <h1>📊 Informe de Estadísticas</h1>
        <div class="fecha">
          Generado el: ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}
        </div>

        <h2>Resumen General</h2>
        <div class="resumen-card">
          <h3>Total de Usuarios</h3>
          <div class="valor">${datos.totalUsuarios.toLocaleString()}</div>
        </div>
        <div class="resumen-card">
          <h3>Total de Pedidos</h3>
          <div class="valor">${datos.totalPedidos.toLocaleString()}</div>
        </div>

        <h2>Usuarios por Rol</h2>
        <table>
          <thead>
            <tr>
              <th>Rol</th>
              <th>Cantidad</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            ${datos.usuariosPorRol.map(item => {
              const porcentaje = ((item.cantidad / datos.totalUsuarios) * 100).toFixed(1);
              return `
                <tr>
                  <td>${item.rol}</td>
                  <td>${item.cantidad}</td>
                  <td>${porcentaje}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <h2>🏆 Ranking - Dinero Gastado (Top 10)</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Total Gastado</th>
            </tr>
          </thead>
          <tbody>
            ${datos.rankingDineroGastado.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.nombre}</td>
                <td>${formatCurrency(item.totalGastado)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>🏆 Ranking - Más Pedidos (Top 10)</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Total Pedidos</th>
            </tr>
          </thead>
          <tbody>
            ${datos.rankingMasPedidos.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.nombre}</td>
                <td>${formatCount(item.totalPedidos)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>🏆 Ranking - Más Diseños (Top 10)</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Total Diseños</th>
            </tr>
          </thead>
          <tbody>
            ${datos.rankingMasDisenos.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.nombre}</td>
                <td>${formatCount(item.totalDisenos)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
            // Cerrar la ventana después de imprimir (opcional)
            // window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    return true;
  } catch (error) {
    console.error('Error al imprimir:', error);
    return false;
  }
};
