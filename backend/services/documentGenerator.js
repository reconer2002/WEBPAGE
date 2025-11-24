const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Asegurar que exista el directorio de documentos
const docsDir = path.join(__dirname, '..', 'documentos');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

/**
 * Genera una boleta en PDF
 * @param {Object} data - Datos de la boleta
 * @returns {Promise<string>} - Ruta del archivo generado
 */
async function generarBoletaPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const fileName = `boleta_${data.pedido_id}_${Date.now()}.pdf`;
      const filePath = path.join(docsDir, fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('BOLETA ELECTRÓNICA', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`N° ${data.pedido_id}`, { align: 'center' });
      doc.moveDown(2);

      // Datos del emisor (tienda)
      doc.fontSize(12).font('Helvetica-Bold').text('Datos del Emisor', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Razón Social: ${data.razon_social || 'Mentes Creativas Store'}`);
      doc.text(`RUT: ${data.rut_responsable || 'N/A'}`);
      doc.text(`Dirección: ${data.direccion_casa_matriz || 'N/A'}`);
      doc.text(`Teléfono: ${data.telefono_contacto || 'N/A'}`);
      doc.text(`Email: ${data.gmail}`);
      if (data.direccion_web) {
        doc.text(`Sitio Web: ${data.direccion_web}`);
      }
      doc.moveDown(2);

      // Fecha de emisión
      doc.fontSize(10).font('Helvetica');
      doc.text(`Fecha de Emisión: ${new Date(data.fecha_emision).toLocaleString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);
      doc.moveDown(2);

      // Detalle de productos (si están disponibles)
      if (data.items && data.items.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Detalle de Productos', { underline: true });
        doc.moveDown(0.5);
        
        // Tabla de productos
        const tableTop = doc.y;
        const itemX = 50;
        const qtyX = 350;
        const priceX = 420;
        const totalX = 490;

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Producto', itemX, tableTop);
        doc.text('Cant.', qtyX, tableTop);
        doc.text('Precio', priceX, tableTop);
        doc.text('Total', totalX, tableTop);
        
        doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        let y = tableTop + 20;
        doc.font('Helvetica');
        
        data.items.forEach(item => {
          doc.text(item.name || 'Producto', itemX, y, { width: 280 });
          doc.text(item.quantity || 1, qtyX, y);
          doc.text(`$${Number(item.price || 0).toLocaleString('es-CL')}`, priceX, y);
          doc.text(`$${Number((item.price || 0) * (item.quantity || 1)).toLocaleString('es-CL')}`, totalX, y);
          y += 20;
        });
        
        doc.moveDown(2);
      }

      // Total
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`MONTO TOTAL: $${Number(data.monto).toLocaleString('es-CL')}`, { align: 'right' });
      doc.moveDown(3);

      // Footer
      doc.fontSize(8).font('Helvetica').text(
        'Este documento es una representación impresa de la boleta electrónica.',
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Genera una factura en PDF
 * @param {Object} data - Datos de la factura
 * @returns {Promise<string>} - Ruta del archivo generado
 */
async function generarFacturaPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const fileName = `factura_${data.pedido_id}_${Date.now()}.pdf`;
      const filePath = path.join(docsDir, fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('FACTURA ELECTRÓNICA', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`N° ${data.pedido_id}`, { align: 'center' });
      doc.moveDown(2);

      // Datos del emisor (tienda)
      doc.fontSize(12).font('Helvetica-Bold').text('Datos del Emisor', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Razón Social: ${data.razon_social || 'Mentes Creativas Store'}`);
      doc.text(`RUT: ${data.rut_responsable || 'N/A'}`);
      doc.text(`Dirección: ${data.direccion_casa_matriz || 'N/A'}`);
      doc.text(`Teléfono: ${data.telefono_contacto || 'N/A'}`);
      doc.moveDown(2);

      // Datos del cliente
      doc.fontSize(12).font('Helvetica-Bold').text('Datos del Cliente', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre/Razón Social: ${data.nombre_cliente}`);
      doc.text(`RUT: ${data.rut_cliente}`);
      doc.text(`Giro: ${data.giro}`);
      doc.text(`Dirección: ${data.direccion}`);
      doc.text(`Comuna: ${data.comuna}`);
      doc.text(`Ciudad: ${data.ciudad}`);
      doc.text(`Teléfono: ${data.telefono}`);
      if (data.referencia) {
        doc.text(`Referencia: ${data.referencia}`);
      }
      doc.moveDown(2);

      // Fecha de emisión
      doc.fontSize(10).font('Helvetica');
      const fechaEmision = data.fecha_emision || new Date();
      doc.text(`Fecha de Emisión: ${new Date(fechaEmision).toLocaleString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);
      doc.moveDown(2);

      // Detalle de productos (si están disponibles)
      if (data.items && data.items.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Detalle de Productos', { underline: true });
        doc.moveDown(0.5);
        
        // Tabla de productos
        const tableTop = doc.y;
        const itemX = 50;
        const qtyX = 350;
        const priceX = 420;
        const totalX = 490;

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Producto', itemX, tableTop);
        doc.text('Cant.', qtyX, tableTop);
        doc.text('Precio', priceX, tableTop);
        doc.text('Total', totalX, tableTop);
        
        doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        let y = tableTop + 20;
        doc.font('Helvetica');
        
        let subtotal = 0;
        data.items.forEach(item => {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          doc.text(item.name || 'Producto', itemX, y, { width: 280 });
          doc.text(item.quantity || 1, qtyX, y);
          doc.text(`$${Number(item.price || 0).toLocaleString('es-CL')}`, priceX, y);
          doc.text(`$${Number(itemTotal).toLocaleString('es-CL')}`, totalX, y);
          subtotal += itemTotal;
          y += 20;
        });
        
        doc.moveDown(2);

        // Subtotal, IVA y Total
        const totalsX = 420;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Subtotal: $${Number(subtotal).toLocaleString('es-CL')}`, totalsX, doc.y);
        doc.text(`IVA (19%): $${Number(subtotal * 0.19).toLocaleString('es-CL')}`, totalsX, doc.y);
        doc.moveDown(0.5);
      }

      // Total
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`MONTO TOTAL: $${Number(data.monto || 0).toLocaleString('es-CL')}`, { align: 'right' });
      doc.moveDown(3);

      // Footer
      doc.fontSize(8).font('Helvetica').text(
        'Este documento es una representación impresa de la factura electrónica.',
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generarBoletaPDF,
  generarFacturaPDF
};
