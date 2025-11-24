import { jsPDF } from 'jspdf';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Resuelve la URL de una imagen
 */
const resolveUrl = (u) => {
  if (!u) return u;
  const s = String(u).trim();
  if (!s) return s;
  if (s.startsWith('data:')) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/img/')) return `${BACKEND_URL}${s}`;
  return s;
};

/**
 * Carga una imagen y la convierte a data URL
 */
const loadImageAsDataURL = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = url;
  });
};

/**
 * Renderiza una vista del diseño en un canvas
 */
const renderVistaEnCanvas = async (imagenBase, elementos) => {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      // Aumentar resolución para mejor calidad (3x)
      const scale = 3;
      canvas.width = 400 * scale;
      canvas.height = 500 * scale;
      const ctx = canvas.getContext('2d');
      
      // Escalar el contexto
      ctx.scale(scale, scale);
      
      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 500);
      
      // Cargar y dibujar imagen base
      const imgBase = new Image();
      imgBase.crossOrigin = 'anonymous';
      
      imgBase.onload = async () => {
        // Mejorar calidad de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(imgBase, 0, 0, 400, 500);
        
        // Procesar elementos
        const imagenesElementos = elementos.filter(el => el.type === 'image');
        let imagenesRestantes = imagenesElementos.length;
        
        // Función para verificar si todas las imágenes están listas
        const checkComplete = () => {
          if (imagenesRestantes === 0) {
            // Exportar con máxima calidad
            resolve(canvas.toDataURL('image/png', 1.0));
          }
        };
        
        // Dibujar elementos
        for (const el of elementos) {
          if (el.type === 'text') {
            ctx.save();
            ctx.translate(el.x, el.y);
            ctx.rotate((el.rotation || 0) * Math.PI / 180);
            ctx.font = `${el.fontStyle === 'bold' ? 'bold' : el.fontStyle === 'italic' ? 'italic' : 'normal'} ${el.fontSize}px ${el.fontFamily || 'Arial'}`;
            ctx.fillStyle = el.fill || '#000000';
            ctx.textBaseline = 'top';
            ctx.fillText(el.text, 0, 0);
            ctx.restore();
          } else if (el.type === 'image' && el.url) {
            const imgEl = new Image();
            imgEl.crossOrigin = 'anonymous';
            
            imgEl.onload = () => {
              ctx.save();
              ctx.translate(el.x, el.y);
              ctx.rotate((el.rotation || 0) * Math.PI / 180);
              ctx.drawImage(imgEl, 0, 0, el.width, el.height);
              ctx.restore();
              imagenesRestantes--;
              checkComplete();
            };
            
            imgEl.onerror = () => {
              imagenesRestantes--;
              checkComplete();
            };
            
            imgEl.src = resolveUrl(el.url);
          }
        }
        
        // Si no hay imágenes, resolver inmediatamente
        if (imagenesRestantes === 0) {
          resolve(canvas.toDataURL('image/png', 1.0));
        }
      };
      
      imgBase.onerror = () => reject(new Error('Error al cargar imagen base'));
      imgBase.src = resolveUrl(imagenBase);
      
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Exporta los diseños de un pedido a PDF
 * @param {Array} detalles - Array con los detalles del pedido obtenidos del endpoint /api/pedidos/:id/detalles
 * @param {number} pedidoId - ID del pedido
 */
export const exportarDisenosPedidoAPDF = async (detalles, pedidoId) => {
  try {
    if (!detalles || detalles.length === 0) {
      throw new Error('No hay diseños para exportar');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let primeraPagina = true;

    for (const item of detalles) {
      const vistas = item.vistas_disponibles || [];
      
      for (const vista of vistas) {
        if (!primeraPagina) {
          pdf.addPage();
        }
        primeraPagina = false;

        // Título
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Pedido #${pedidoId} - ${item.diseno_nombre}`, 105, 15, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Artículo: ${item.articulo_nombre}`, 105, 22, { align: 'center' });
        
        // Etiqueta de vista
        const vistaLabels = {
          'frente': 'Vista: Frente',
          'detras': 'Vista: Detrás',
          'izquierda': 'Vista: Izquierda',
          'derecha': 'Vista: Derecha'
        };
        pdf.setFontSize(10);
        pdf.text(vistaLabels[vista] || `Vista: ${vista}`, 105, 28, { align: 'center' });

        // Renderizar la vista
        const imagenBase = item.imagenes_vistas[vista];
        const elementos = item.elementos_por_vista[vista] || [];

        if (imagenBase) {
          try {
            const dataUrl = await renderVistaEnCanvas(imagenBase, elementos);
            
            // Calcular dimensiones para el PDF (mantener aspecto 4:5)
            const pdfWidth = 120; // mm
            const pdfHeight = 150; // mm
            const x = (210 - pdfWidth) / 2; // centrar en A4
            const y = 35;

            // Usar JPEG con máxima calidad para mejor compresión y calidad
            pdf.addImage(dataUrl, 'PNG', x, y, pdfWidth, pdfHeight, undefined, 'FAST');
          } catch (error) {
            console.error(`Error al renderizar vista ${vista}:`, error);
            pdf.setFontSize(10);
            pdf.text('Error al generar vista', 105, 100, { align: 'center' });
          }
        }

        // Información adicional en la parte inferior
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(`Precio: $${Number(item.precio_unitario || 0).toLocaleString('es-CL')}`, 105, 200, { align: 'center' });
      }
    }

    // Guardar el PDF
    pdf.save(`pedido_${pedidoId}_disenos.pdf`);
    return true;
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    throw error;
  }
};
