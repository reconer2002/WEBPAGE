// Funciones auxiliares para la herramienta de diseño

// Función helper para mapear variantes como en el mantenedor
export const mapVariantesObjeto = (objeto) => {
  const m = {};
  (objeto.variantes || []).forEach(v => {
    m[v.categoria] = { id: v.id, nombre: v.nombre || v.valor };
  });
  return m;
};

// Función helper para generar nombre del objeto como en el mantenedor
export const generarNombreObjeto = (objeto) => {
  if (!objeto.variantes || objeto.variantes.length === 0) {
    return `${objeto.articulo_nombre} (Básico)`;
  }
  
  const variantesMap = mapVariantesObjeto(objeto);
  const categorias = [...new Set(objeto.variantes.map(v => v.categoria))];
  const nombreGenerado = categorias.map(cat => variantesMap[cat]?.nombre || "-").join(" - ");
  
  // Debug: uncomment next line to see generated names
  // console.log('Objeto:', objeto.id, 'Categorías:', categorias, 'Variantes Map:', variantesMap, 'Nombre:', nombreGenerado);
  
  return nombreGenerado;
};

// Función helper para construir URLs de imágenes
export const buildImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // Si ya es una URL completa, devolverla tal como está
  if (imagePath.startsWith('http')) return imagePath;
  // Si empieza con /, usar tal como está (el proxy de Vite lo manejará)
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  // Si no tiene /, asumir que es una ruta relativa y agregarle /img/
  return `/img/${imagePath}`;
};

// Función para posicionar elementos en el canvas
export const calcularPosicionElemento = (posicion, canvasWidth, canvasHeight, elementWidth, elementHeight) => {
  let newX, newY;
  // Márgenes optimizados para diseño de polera - zona central concentrada
  const marginX = 100; // Margen horizontal más amplio - lados más al centro
  const marginY = 120; // Margen vertical más amplio - superior/inferior más al centro

  switch (posicion) {
    case 'top-left':
      newX = marginX;
      newY = marginY;
      break;
    case 'top-center':
      newX = (canvasWidth - elementWidth) / 2;
      newY = marginY;
      break;
    case 'top-right':
      newX = canvasWidth - elementWidth - marginX;
      newY = marginY;
      break;
    case 'middle-left':
      newX = marginX;
      newY = (canvasHeight - elementHeight) / 2;
      break;
    case 'middle-center':
      newX = (canvasWidth - elementWidth) / 2;
      newY = (canvasHeight - elementHeight) / 2;
      break;
    case 'middle-right':
      newX = canvasWidth - elementWidth - marginX;
      newY = (canvasHeight - elementHeight) / 2;
      break;
    case 'bottom-left':
      newX = marginX;
      newY = canvasHeight - elementHeight - marginY;
      break;
    case 'bottom-center':
      newX = (canvasWidth - elementWidth) / 2;
      newY = canvasHeight - elementHeight - marginY;
      break;
    case 'bottom-right':
      newX = canvasWidth - elementWidth - marginX;
      newY = canvasHeight - elementHeight - marginY;
      break;
    default:
      return { x: 0, y: 0 };
  }

  return { x: Math.max(0, newX), y: Math.max(0, newY) };
};

// Función para configurar imágenes de vistas basado en el objeto seleccionado
export const configurarImagenesVistas = (objeto, diseniosBase, articulos) => {
  // Obtener el diseño base del objeto
  const disenioBase = diseniosBase.find(d => d.id === objeto.disenio_base_id);
  
  if (disenioBase) {
    // Usar las imágenes del diseño base para las diferentes vistas
    return {
      frente: buildImageUrl(disenioBase.frente),
      izquierda: buildImageUrl(disenioBase.izquierda),
      derecha: buildImageUrl(disenioBase.derecha),
      detras: buildImageUrl(disenioBase.espalda)
    };
  } else {
    // Fallback a las imágenes del artículo si no hay diseño base
    const articulo = articulos.find(a => a.id === objeto.articulo_id);
    
    if (articulo && (articulo.foto_frente || articulo.foto)) {
      return {
        frente: buildImageUrl(articulo.foto_frente || articulo.foto),
        izquierda: buildImageUrl(articulo.foto_izquierda || articulo.foto),
        derecha: buildImageUrl(articulo.foto_derecha || articulo.foto),
        detras: buildImageUrl(articulo.foto_detras || articulo.foto)
      };
    } else {
      // Usar imágenes predeterminadas como último recurso
      return {
        frente: buildImageUrl('/img/disenios_base/PoleraAmarillaFront.png'),
        izquierda: buildImageUrl('/img/disenios_base/PoleraAmarillaLeft.png'),
        derecha: buildImageUrl('/img/disenios_base/PoleraAmarillaRight.png'),
        detras: buildImageUrl('/img/disenios_base/PoleraAmarillaBack.png')
      };
    }
  }
};