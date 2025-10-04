import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Text, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import "./HerramientaDiseño.css";
import articulosService from "../../services/articulosService";
import objetosService from "../../services/objetosService";
import diseniosBaseService from "../../services/diseniosBaseService";
import disenosMockService from "../../services/disenosMockService";
import ImagenElemento from "./ImagenElemento";

const HerramientaDiseño = ({ onDisenoGuardado }) => {
  const [canvasWidth] = useState(400);
  const [canvasHeight] = useState(500);
  // Cambiar elementos para mantener estado independiente por vista
  const [elementosPorVista, setElementosPorVista] = useState({
    frente: [],
    izquierda: [],
    derecha: [],
    detras: []
  });
  const [selectedId, setSelectedId] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [todosLosObjetos, setTodosLosObjetos] = useState([]);
  const [objetoSeleccionado, setObjetoSeleccionado] = useState(null);
  const [diseniosBase, setDiseniosBase] = useState([]);
  const [vistaActual, setVistaActual] = useState('frente'); // 'frente', 'izquierda', 'derecha', 'detras'
  const [imagenesVistas, setImagenesVistas] = useState({
    frente: null,
    izquierda: null,
    derecha: null,
    detras: null
  });
  const [loading, setLoading] = useState(true);
  const [guardandoDiseno, setGuardandoDiseno] = useState(false);

  const stageRef = useRef(null);
  const inputRef = useRef(null);

  // Función auxiliar para obtener elementos de la vista actual
  const elementos = elementosPorVista[vistaActual] || [];
  
  // Función auxiliar para actualizar elementos de la vista actual
  const setElementos = (callback) => {
    setElementosPorVista(prev => ({
      ...prev,
      [vistaActual]: typeof callback === 'function' ? callback(prev[vistaActual] || []) : callback
    }));
  };

  const [textInputValue, setTextInputValue] = useState("");
  const [textStyle, setTextStyle] = useState({ fontSize: 20, fill: "#000000", fontFamily: "Arial", fontStyle: "normal" });
  const [imageEditMode, setImageEditMode] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 100, height: 100 });
  const [currentImageRotation, setCurrentImageRotation] = useState(0);

  const [baseImage, imageStatus] = useImage(imagenesVistas[vistaActual] || "", 'anonymous');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [articulosData, diseniosData] = await Promise.all([
          articulosService.getArticulos(),
          diseniosBaseService.getAll()
        ]);
        setArticulos(articulosData);
        setDiseniosBase(diseniosData);
        
        // Cargar todos los objetos de todos los artículos
        const todosObjetos = [];
        for (const articulo of articulosData) {
          try {
            const objetosArticulo = await objetosService.getObjetos(articulo.id);
            // Agregar información del artículo a cada objeto
            const objetosConArticulo = objetosArticulo.map(objeto => ({
              ...objeto,
              articulo_nombre: articulo.nombre,
              articulo_descripcion: articulo.descripcion
            }));
            todosObjetos.push(...objetosConArticulo);
          } catch (error) {
            console.error(`Error al cargar objetos del artículo ${articulo.id}:`, error);
          }
        }
        setTodosLosObjetos(todosObjetos);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Función helper para mapear variantes como en el mantenedor
  const mapVariantesObjeto = (objeto) => {
    const m = {};
    (objeto.variantes || []).forEach(v => {
      m[v.categoria] = { id: v.id, nombre: v.nombre || v.valor };
    });
    return m;
  };

  // Función helper para generar nombre del objeto como en el mantenedor
  const generarNombreObjeto = (objeto) => {
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;
      const selectedElement = elementos.find((el) => el.id === selectedId);
      if (!selectedElement) return;
      if (selectedElement.type === "text" && document.activeElement === inputRef.current) return;

      switch (e.key) {
        case "Delete":
          e.preventDefault();
          eliminarElemento(selectedId);
          break;
        case "d":
        case "D":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            duplicarElemento(selectedId);
          }
          break;
        default:
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, elementos, vistaActual]); // Agregar vistaActual como dependencia

  // Close panels on Escape key (works even if panel is open)
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        setImageEditMode(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);



  const agregarTexto = () => {
    const marginY = 120; // Mismo margen que en posicionarElemento
    const fontSize = 20;
    const text = "Texto";
    const estimatedWidth = text.length * fontSize * 0.6;
    const x = (canvasWidth - estimatedWidth) / 2; // Centrado horizontalmente
    const y = marginY; // Posición superior
    
    const nuevoTexto = { 
      id: Date.now(), 
      type: "text", 
      x, 
      y, 
      text, 
      fontSize, 
      fill: "#000000", 
      fontFamily: "Arial", 
      fontStyle: "normal", 
      rotation: 0, 
      scale: 1 
    };
    setElementos((prev) => [...prev, nuevoTexto]);
    
    // Seleccionar el nuevo elemento automáticamente
    setSelectedId(nuevoTexto.id);
    setImageEditMode(false);
    setTextInputValue(text);
    setTextStyle({ fontSize, fill: "#000000", fontFamily: "Arial", fontStyle: "normal", rotation: 0, scale: 1 });
    
    // Enfocar el input de texto después de un breve delay
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const agregarImagen = (url, originalWidth = 100, originalHeight = 100) => {
    const marginY = 120; // Mismo margen que en posicionarElemento
    
    // Escalar la imagen si es muy grande, manteniendo la proporción
    const maxWidth = 200;
    const maxHeight = 200;
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }
    
    const x = (canvasWidth - width) / 2; // Centrado horizontalmente
    const y = marginY; // Posición superior
    
    const nuevaImagen = { 
      id: Date.now(), 
      type: "image", 
      x, 
      y, 
      url, 
      width: Math.round(width), 
      height: Math.round(height), 
      rotation: 0, 
      draggable: true 
    };
    setElementos((prev) => [...prev, nuevaImagen]);
    
    // Seleccionar la nueva imagen automáticamente
    setSelectedId(nuevaImagen.id);
    setImageEditMode(true);
    setImageDimensions({ width: Math.round(width), height: Math.round(height) });
    setCurrentImageRotation(0);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }
    const url = URL.createObjectURL(file);
    
    // Crear una imagen temporal para obtener las dimensiones originales
    const img = new Image();
    img.onload = () => {
      agregarImagen(url, img.width, img.height);
    };
    img.src = url;
    
    e.target.value = "";
  };



  const handleObjetoSelect = (objeto) => {
    setObjetoSeleccionado(objeto);
    
    // Obtener el diseño base del objeto
    const disenioBase = diseniosBase.find(d => d.id === objeto.disenio_base_id);
    
    // Función helper para construir URLs de imágenes
    const buildImageUrl = (imagePath) => {
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
    
    if (disenioBase) {
      // Usar las imágenes del diseño base para las diferentes vistas
      const imagenesVistas = {
        frente: buildImageUrl(disenioBase.frente),
        izquierda: buildImageUrl(disenioBase.izquierda),
        derecha: buildImageUrl(disenioBase.derecha),
        detras: buildImageUrl(disenioBase.espalda)
      };
      
      setImagenesVistas(imagenesVistas);
    } else {
      // Fallback a las imágenes del artículo si no hay diseño base
      const articulo = articulos.find(a => a.id === objeto.articulo_id);
      
      if (articulo && (articulo.foto_frente || articulo.foto)) {
        setImagenesVistas({
          frente: buildImageUrl(articulo.foto_frente || articulo.foto),
          izquierda: buildImageUrl(articulo.foto_izquierda || articulo.foto),
          derecha: buildImageUrl(articulo.foto_derecha || articulo.foto),
          detras: buildImageUrl(articulo.foto_detras || articulo.foto)
        });
      } else {
        // Usar imágenes predeterminadas como último recurso
        setImagenesVistas({
          frente: buildImageUrl('/img/disenios_base/PoleraAmarillaFront.png'),
          izquierda: buildImageUrl('/img/disenios_base/PoleraAmarillaLeft.png'),
          derecha: buildImageUrl('/img/disenios_base/PoleraAmarillaRight.png'),
          detras: buildImageUrl('/img/disenios_base/PoleraAmarillaBack.png')
        });
      }
    }
  };

  const cambiarVista = (vista) => {
    setVistaActual(vista);
    // Limpiar selección al cambiar de vista
    setSelectedId(null);
    setImageEditMode(false);
  };

  const posicionarElemento = (posicion) => {
    if (!selectedId) return;
    
    const elemento = elementos.find(el => el.id === selectedId);
    if (!elemento) return;

    let newX, newY;
    // Márgenes optimizados para diseño de polera - zona central concentrada
    const marginX = 100; // Margen horizontal más amplio - lados más al centro
    const marginY = 120; // Margen vertical más amplio - superior/inferior más al centro
    const elementWidth = elemento.width || (elemento.text ? elemento.text.length * (elemento.fontSize || 16) * 0.6 : 100);
    const elementHeight = elemento.height || (elemento.fontSize || 16);

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
        return;
    }

    actualizarElemento(selectedId, { x: Math.max(0, newX), y: Math.max(0, newY) });
  };

  const captureAndUploadViews = async () => {
    if (!objetoSeleccionado) {
      alert("Primero selecciona un objeto para personalizar");
      return;
    }

    try {
      setGuardandoDiseno(true);
      
      // Guardar el ID del elemento seleccionado actual
      const elementoSeleccionadoAntes = selectedId;
      
      // Deseleccionar temporalmente para que no aparezcan los controles
      setSelectedId(null);
      setImageEditMode(false);
      
      // Esperar un frame para que se actualice la UI
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Capturar imagen de la vista actual del canvas
      const stage = stageRef.current;
      const dataURL = stage.toDataURL({ mimeType: 'image/png', quality: 1 });
      
      // Restaurar la selección después de la captura
      setSelectedId(elementoSeleccionadoAntes);
      if (elementoSeleccionadoAntes) {
        const elemento = elementos.find(el => el.id === elementoSeleccionadoAntes);
        if (elemento?.type === "image") {
          setImageEditMode(true);
        }
      }
      
      // Crear el nombre del diseño
      const nombreDiseno = prompt("Ingresa un nombre para tu diseño:", 
        `Diseño ${objetoSeleccionado.articulo_nombre} ${new Date().toLocaleDateString()}`);
      
      if (!nombreDiseno) {
        setGuardandoDiseno(false);
        return;
      }

      // Preparar datos del diseño
      const disenoData = {
        nombre: nombreDiseno,
        objeto_id: objetoSeleccionado.id,
        articulo_nombre: objetoSeleccionado.articulo_nombre,
        articulo_id: objetoSeleccionado.articulo_id,
        precio: objetoSeleccionado.precio,
        imagen: dataURL, // Imagen principal (vista actual)
        vista_principal: vistaActual,
        elementos_por_vista: elementosPorVista, // Guardar todos los elementos
        imagenes_base: imagenesVistas, // Guardar las imágenes base de todas las vistas
        variantes: objetoSeleccionado.variantes || []
      };

      // Guardar usando el servicio mock
      const disenoGuardado = await disenosMockService.guardarDiseno(disenoData);
      
      alert(`¡Diseño "${nombreDiseno}" guardado exitosamente!`);
      console.log("Diseño guardado:", disenoGuardado);

      // Notificar al componente padre que se guardó un diseño
      if (onDisenoGuardado) {
        onDisenoGuardado();
      }

    } catch (error) {
      console.error("Error al guardar el diseño:", error);
      alert("Error al guardar el diseño. Inténtalo de nuevo.");
    } finally {
      setGuardandoDiseno(false);
    }
  };

  const actualizarElemento = (id, cambios) => setElementos((prev) => prev.map((el) => (el.id === id ? { ...el, ...cambios } : el)));

  const eliminarElemento = (id) => {
    setElementos((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setImageEditMode(false);
    }
  };

  const duplicarElemento = (id) => {
    const elemento = elementos.find((el) => el.id === id);
    if (!elemento) return;
    const nuevoElemento = { ...elemento, id: Date.now(), x: elemento.x + 20, y: elemento.y + 20 };
    setElementos((prev) => [...prev, nuevoElemento]);
    setSelectedId(nuevoElemento.id);
    if (elemento.type === "image") {
      setImageEditMode(true);
      setImageDimensions({ width: elemento.width, height: elemento.height });
    }
  };

  const cambiarCapaElemento = (id, direccion) => {
    const index = elementos.findIndex((el) => el.id === id);
    if (index === -1) return;
    const nuevosElementos = [...elementos];
    const elemento = nuevosElementos[index];
    if (direccion === "arriba" && index < elementos.length - 1) {
      nuevosElementos[index] = nuevosElementos[index + 1];
      nuevosElementos[index + 1] = elemento;
    } else if (direccion === "abajo" && index > 0) {
      nuevosElementos[index] = nuevosElementos[index - 1];
      nuevosElementos[index - 1] = elemento;
    }
    setElementos(nuevosElementos);
  };

  const actualizarDimensionesImagen = (id, width, height) => {
    actualizarElemento(id, { width: Math.max(20, width), height: Math.max(20, height) });
    setImageDimensions({ width: Math.max(20, width), height: Math.max(20, height) });
  };

  const handleSelectElement = (el) => {
    setSelectedId(el.id);
    if (el.type === "text") {
      setImageEditMode(false);
      setTextInputValue(el.text);
      setTextStyle({ fontSize: el.fontSize, fill: el.fill, fontFamily: el.fontFamily || "Arial", fontStyle: el.fontStyle || "normal", rotation: el.rotation || 0, scale: el.scale || 1 });
      setTimeout(() => inputRef.current?.focus(), 10);
    } else if (el.type === "image") {
      setImageEditMode(true);
      setImageDimensions({ width: el.width, height: el.height });
      setCurrentImageRotation(el.rotation || 0);
    }
  };

  const handleTextInputChange = (e) => {
    setTextInputValue(e.target.value);
    actualizarElemento(selectedId, { text: e.target.value });
  };

  return (
    <div className="herramienta-diseño-container centered-layout">
      {/* Panel de edición a la izquierda */}
      <div className="edit-panel-column">
        {selectedId && (
          <div className="edit-panel-sidebar">
            {!imageEditMode ? (
              <>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 8, color: "#374151" }}>✏️ Editar Texto</div>
                <input ref={inputRef} className="edit-panel-text-input" style={{ fontSize: textStyle.fontSize + "px", color: textStyle.fill }} value={textInputValue} onChange={handleTextInputChange} autoFocus placeholder="Escribe texto..." />

                <div className="text-style-panel-bubble">
                  <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <button onClick={() => duplicarElemento(selectedId)} className="action-button duplicate" title="Duplicar (Ctrl+D)">📄 Duplicar</button>
                    <button onClick={() => eliminarElemento(selectedId)} className="action-button delete" title="Eliminar (Delete)">🗑️ Eliminar</button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <label style={{ fontSize: 12 }}>
                      Color:
                      <input type="color" value={textStyle.fill} onChange={(e) => { setTextStyle({ ...textStyle, fill: e.target.value }); actualizarElemento(selectedId, { fill: e.target.value }); }} style={{ width: "100%", height: "24px", border: 0, borderRadius: 4 }} />
                    </label>

                    <label style={{ fontSize: 12 }}>
                      Tamaño:
                      <input type="number" value={textStyle.fontSize} min="8" max="72" onChange={(e) => { const size = parseInt(e.target.value) || 20; setTextStyle({ ...textStyle, fontSize: size }); actualizarElemento(selectedId, { fontSize: size }); }} style={{ width: "100%" }} />
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <label style={{ fontSize: 12 }}>
                      Fuente:
                      <select value={textStyle.fontFamily} onChange={(e) => { setTextStyle({ ...textStyle, fontFamily: e.target.value }); actualizarElemento(selectedId, { fontFamily: e.target.value }); }} style={{ width: "100%", fontSize: 11 }}>
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times</option>
                        <option value="Courier New">Courier</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Impact">Impact</option>
                      </select>
                    </label>

                    <label style={{ fontSize: 12 }}>
                      Estilo:
                      <select value={textStyle.fontStyle} onChange={(e) => { setTextStyle({ ...textStyle, fontStyle: e.target.value }); actualizarElemento(selectedId, { fontStyle: e.target.value }); }} style={{ width: "100%", fontSize: 11 }}>
                        <option value="normal">Normal</option>
                        <option value="bold">Negrita</option>
                        <option value="italic">Cursiva</option>
                        <option value="bold italic">Negrita Cursiva</option>
                      </select>
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginBottom: "8px" }}>
                    <label style={{ fontSize: 12 }}>
                      Ángulo (grados):
                      <input type="number" value={Math.round(textStyle.rotation || 0)} min="-360" max="360" onChange={(e) => { const rotation = parseInt(e.target.value) || 0; setTextStyle({ ...textStyle, rotation }); actualizarElemento(selectedId, { rotation }); }} style={{ width: "100%" }} />
                    </label>
                  </div>

                  <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "6px" }}>Posición rápida:</div>
                    <div className="position-grid">
                      <button onClick={() => posicionarElemento('top-left')} className="position-button" title="Superior izquierda">↖️</button>
                      <button onClick={() => posicionarElemento('top-center')} className="position-button" title="Superior centro">⬆️</button>
                      <button onClick={() => posicionarElemento('top-right')} className="position-button" title="Superior derecha">↗️</button>
                      <button onClick={() => posicionarElemento('middle-left')} className="position-button" title="Centro izquierda">⬅️</button>
                      <button onClick={() => posicionarElemento('middle-center')} className="position-button" title="Centro">⭕</button>
                      <button onClick={() => posicionarElemento('middle-right')} className="position-button" title="Centro derecha">➡️</button>
                      <button onClick={() => posicionarElemento('bottom-left')} className="position-button" title="Inferior izquierda">↙️</button>
                      <button onClick={() => posicionarElemento('bottom-center')} className="position-button" title="Inferior centro">⬇️</button>
                      <button onClick={() => posicionarElemento('bottom-right')} className="position-button" title="Inferior derecha">↘️</button>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "6px", marginTop: "8px" }}>Capas:</div>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <button onClick={() => cambiarCapaElemento(selectedId, "arriba")} className="layer-button" title="Traer al frente">↑ Frente</button>
                      <button onClick={() => cambiarCapaElemento(selectedId, "abajo")} className="layer-button" title="Enviar atrás">↓ Atrás</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 8, color: "#374151" }}>🖼️ Editar Imagen</div>
                <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <button onClick={() => duplicarElemento(selectedId)} className="action-button duplicate" title="Duplicar (Ctrl+D)">📄 Duplicar</button>
                  <button onClick={() => eliminarElemento(selectedId)} className="action-button delete" title="Eliminar (Delete)">🗑️ Eliminar</button>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: "6px" }}>Dimensiones:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <label style={{ fontSize: 12 }}>
                      Ancho:
                      <input type="number" min="20" max="400" value={imageDimensions.width} onChange={(e) => { const width = parseInt(e.target.value) || 20; actualizarDimensionesImagen(selectedId, width, imageDimensions.height); }} style={{ width: "100%" }} />
                    </label>
                    <label style={{ fontSize: 12 }}>
                      Alto:
                      <input type="number" min="20" max="400" value={imageDimensions.height} onChange={(e) => { const height = parseInt(e.target.value) || 20; actualizarDimensionesImagen(selectedId, imageDimensions.width, height); }} style={{ width: "100%" }} />
                    </label>
                  </div>
                  <button onClick={() => { const elemento = elementos.find((el) => el.id === selectedId); if (elemento) { const ratio = elemento.width / elemento.height; const newHeight = Math.round(imageDimensions.width / ratio); actualizarDimensionesImagen(selectedId, imageDimensions.width, newHeight); } }} style={{ fontSize: 11, padding: "4px 8px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 4, marginTop: "4px" }}>🔒 Mantener proporción</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginBottom: "8px" }}>
                  <label style={{ fontSize: 12 }}>
                    Ángulo (grados):
                    <input type="number" value={currentImageRotation} min="-360" max="360" onChange={(e) => { const rotation = parseInt(e.target.value) || 0; setCurrentImageRotation(rotation); actualizarElemento(selectedId, { rotation }); }} style={{ width: "100%" }} />
                  </label>
                </div>

                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "6px" }}>Posición rápida:</div>
                  <div className="position-grid">
                    <button onClick={() => posicionarElemento('top-left')} className="position-button" title="Superior izquierda">↖️</button>
                    <button onClick={() => posicionarElemento('top-center')} className="position-button" title="Superior centro">⬆️</button>
                    <button onClick={() => posicionarElemento('top-right')} className="position-button" title="Superior derecha">↗️</button>
                    <button onClick={() => posicionarElemento('middle-left')} className="position-button" title="Centro izquierda">⬅️</button>
                    <button onClick={() => posicionarElemento('middle-center')} className="position-button" title="Centro">⭕</button>
                    <button onClick={() => posicionarElemento('middle-right')} className="position-button" title="Centro derecha">➡️</button>
                    <button onClick={() => posicionarElemento('bottom-left')} className="position-button" title="Inferior izquierda">↙️</button>
                    <button onClick={() => posicionarElemento('bottom-center')} className="position-button" title="Inferior centro">⬇️</button>
                    <button onClick={() => posicionarElemento('bottom-right')} className="position-button" title="Inferior derecha">↘️</button>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "6px", marginTop: "8px" }}>Capas:</div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <button onClick={() => cambiarCapaElemento(selectedId, "arriba")} className="layer-button" title="Traer al frente">↑ Frente</button>
                    <button onClick={() => cambiarCapaElemento(selectedId, "abajo")} className="layer-button" title="Enviar atrás">↓ Atrás</button>
                  </div>
                  <div className="keyboard-hint">Arrastra las esquinas para redimensionar</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Preview al centro */}
      <div className="preview-column">
        <div className="canvas-inner">
          <div className="stage-wrapper">
            <Stage width={canvasWidth} height={canvasHeight} ref={stageRef} onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}>
              <Layer>
                {baseImage && <KonvaImage image={baseImage} width={canvasWidth} height={canvasHeight} />}
                {elementos.map((el) => {
                  if (el.type === "text") {
                    const isSelected = el.id === selectedId;
                    return (
                      <React.Fragment key={el.id}>
                        <Text
                          id={`text-${el.id}`}
                          x={el.x}
                          y={el.y}
                          text={el.text}
                          fontSize={el.fontSize}
                          fill={el.fill}
                          fontFamily={el.fontFamily || "Arial"}
                          fontStyle={el.fontStyle || "normal"}
                          rotation={el.rotation || 0}
                          scale={{ x: el.scale || 1, y: el.scale || 1 }}
                          draggable
                          onDragEnd={(e) => actualizarElemento(el.id, { x: e.target.x(), y: e.target.y() })}
                          onTransform={(e) => {
                            const node = e.target;
                            const newRotation = node.rotation();
                            const scaleX = node.scaleX();
                            const scaleY = node.scaleY();
                            const newFontSize = Math.max(8, Math.round(el.fontSize * Math.max(scaleX, scaleY)));
                            // Update left panel in real-time during transform
                            if (isSelected) {
                              setTextStyle((prev) => ({ ...prev, fontSize: newFontSize, rotation: Math.round(newRotation) }));
                            }
                          }}
                          onTransformEnd={(e) => {
                            const node = e.target;
                            const scaleX = node.scaleX();
                            const scaleY = node.scaleY();
                            node.scaleX(1);
                            node.scaleY(1);
                            const newFontSize = Math.max(8, Math.round(el.fontSize * Math.max(scaleX, scaleY)));
                            const newRotation = node.rotation();
                            actualizarElemento(el.id, { x: node.x(), y: node.y(), rotation: newRotation, fontSize: newFontSize, scale: 1 });
                            if (isSelected) setTextStyle((prev) => ({ ...prev, fontSize: newFontSize, rotation: newRotation }));
                          }}
                          onDblClick={() => handleSelectElement(el)}
                          onClick={() => handleSelectElement(el)}
                        />
                        {isSelected && (
                          <Transformer rotateEnabled={true} enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)} />
                        )}
                      </React.Fragment>
                    );
                  }
                  if (el.type === "image") {
                    return <ImagenElemento key={el.id} el={el} onUpdate={actualizarElemento} isSelected={selectedId === el.id} onSelect={() => handleSelectElement(el)} onTransform={(rotation, width, height) => {
                      // Update left panel in real-time during image transform
                      if (selectedId === el.id) {
                        setImageDimensions({ width: Math.round(width), height: Math.round(height) });
                        setCurrentImageRotation(Math.round(rotation));
                      }
                    }} />;
                  }
                  return null;
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {/* Opciones a la derecha */}
      <div className="options-column">
        <div className="herramienta-diseño-sidebar">
          <div className="top-actions">
            <button 
              onClick={agregarTexto} 
              disabled={!objetoSeleccionado}
              style={{ opacity: objetoSeleccionado ? 1 : 0.5 }}
            >
              Agregar texto
            </button>
            <label className={`image-upload-btn ${!objetoSeleccionado ? 'disabled' : ''}`}>
              🖼️ Agregar imagen
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: "none" }}
                disabled={!objetoSeleccionado}
              />
            </label>
          </div>

          {loading ? (
            <div className="sidebar-section"><div className="loading-state"><p>Cargando objetos...</p></div></div>
          ) : todosLosObjetos.length === 0 ? (
            <div className="sidebar-section"><div className="loading-state"><p>No hay objetos disponibles</p></div></div>
          ) : (
            <>
              {/* Mensaje de ayuda */}
              {!objetoSeleccionado && (
                <div style={{ 
                  fontSize: 12, 
                  color: "#6b7280", 
                  marginTop: "8px", 
                  fontStyle: "italic", 
                  textAlign: "center",
                  padding: "8px",
                  background: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0"
                }}>
                  👆 Selecciona un objeto para comenzar a diseñar
                </div>
              )}
              
              {/* Información del objeto seleccionado */}
              {objetoSeleccionado && (
                <div className="sidebar-section">
                  <strong>Objeto Seleccionado</strong>
                  <div style={{ fontSize: 13, color: "#475569" }}>
                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                      {generarNombreObjeto(objetoSeleccionado)}
                    </div>
                    <div style={{ color: "#059669", fontWeight: "bold" }}>${Number(objetoSeleccionado.precio).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      Artículo: {objetoSeleccionado.articulo_nombre}
                    </div>
                    {objetoSeleccionado.articulo_descripcion && (
                      <div style={{ marginTop: 4, fontSize: 12 }}>{objetoSeleccionado.articulo_descripcion}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Control de vistas */}
              {objetoSeleccionado && (
                <div className="sidebar-section">
                  <strong>Vista del Objeto</strong>
                  <div className="size-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <button 
                      className={`size-btn ${vistaActual === 'frente' ? 'active' : ''}`} 
                      onClick={() => cambiarVista('frente')}
                      title="Vista frontal"
                    >
                      👤 Frente
                    </button>
                    <button 
                      className={`size-btn ${vistaActual === 'detras' ? 'active' : ''}`} 
                      onClick={() => cambiarVista('detras')}
                      title="Vista trasera"
                    >
                      🔄 Detrás
                    </button>
                    <button 
                      className={`size-btn ${vistaActual === 'izquierda' ? 'active' : ''}`} 
                      onClick={() => cambiarVista('izquierda')}
                      title="Vista lateral izquierda"
                    >
                      ⬅️ Izquierda
                    </button>
                    <button 
                      className={`size-btn ${vistaActual === 'derecha' ? 'active' : ''}`} 
                      onClick={() => cambiarVista('derecha')}
                      title="Vista lateral derecha"
                    >
                      ➡️ Derecha
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: "4px", fontStyle: "italic" }}>
                    Vista actual: {vistaActual === 'frente' ? 'Frontal' : vistaActual === 'detras' ? 'Trasera' : vistaActual === 'izquierda' ? 'Lateral Izquierda' : 'Lateral Derecha'}
                  </div>
                </div>
              )}

              {/* Lista de todos los objetos disponibles */}
              <div className="sidebar-section">
                <strong>Objetos Disponibles</strong>
                <div className="objects-grid">
                  {todosLosObjetos.map((objeto) => {
                    const selected = objetoSeleccionado?.id === objeto.id;
                    const disenioBase = diseniosBase.find(d => d.id === objeto.disenio_base_id);
                    
                    // Usar la misma lógica que el mantenedor para generar el nombre
                    const nombreObjeto = generarNombreObjeto(objeto);
                    
                    return (
                      <div 
                        key={objeto.id} 
                        className={`object-item ${selected ? "selected" : ""}`} 
                        onClick={() => handleObjetoSelect(objeto)}
                        title={`${nombreObjeto} - $${objeto.precio}`}
                      >
                        {disenioBase?.imagen && (
                          <img src={disenioBase.imagen} alt={nombreObjeto} />
                        )}
                        <div className="object-info">
                          <div style={{ fontSize: 11, fontWeight: "bold" }}>{nombreObjeto}</div>
                          <div style={{ fontSize: 10, color: "#059669", fontWeight: "bold" }}>
                            ${objeto.precio}
                          </div>
                          {disenioBase && (
                            <div style={{ fontSize: 9, color: "#9ca3af" }}>
                              {disenioBase.nombre}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="sidebar-section">
                <button 
                  className="save-btn" 
                  onClick={captureAndUploadViews} 
                  style={{ 
                    width: "100%", 
                    opacity: (objetoSeleccionado && !guardandoDiseno) ? 1 : 0.5 
                  }}
                  disabled={!objetoSeleccionado || guardandoDiseno}
                >
                  {guardandoDiseno ? "Guardando..." : "💾 Guardar diseño"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HerramientaDiseño;