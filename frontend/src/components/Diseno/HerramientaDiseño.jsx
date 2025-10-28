import React, { useEffect } from "react";
import "./HerramientaDiseño.css";
import { useHerramientaDiseño } from "./hooks/useHerramientaDiseño";
import CanvasDiseño from "./components/Canvas/CanvasDiseño";
import SidebarDiseño from "./components/Sidebar/SidebarDiseño";

const HerramientaDiseño = ({ editarId }) => {
  const {
    // Estados
    elementos,
    selectedId,
    setSelectedId,
    articulos,
    todosLosObjetos,
    objetoSeleccionado,
    diseniosBase,
    vistaActual,
    imagenesVistas,
    loading,
    guardandoDiseno,
    disenoIdActual,
    nombreDisenoActual,
    textInputValue,
    textStyle,
    setTextStyle,
    imageEditMode,
    setImageEditMode,
    imageDimensions,
    currentImageRotation,
    setCurrentImageRotation,
    canvasWidth,
    canvasHeight,
    
    // Referencias
    stageRef,
    inputRef,
    
    // Funciones
    agregarTexto,
    agregarImagen,
    handleImageUpload,
    handleObjetoSelect,
    cambiarVista,
    posicionarElemento,
    captureAndUploadViews,
    actualizarElemento,
    eliminarElemento,
    duplicarElemento,
    cambiarCapaElemento,
    actualizarDimensionesImagen,
    actualizarRotacionImagen,
    sincronizarEstadoTexto,
    sincronizarEstadoImagen,
    handleSelectElement,
    handleTextInputChange,
    saveAndAddToCart,
    cargarDiseno,
  } = useHerramientaDiseño();

  // Cargar diseño si se proporciona editarId
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

  // Guardar diseño usando API real y (opcional) agregar al carrito
  const saveDesign = async () => {
    if (!objetoSeleccionado) {
      alert("Primero selecciona un objeto para personalizar");
      return null;
    }
    try {
      setGuardandoDiseno(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Necesitas iniciar sesión para guardar el diseño");
        return null;
      }

      // Ocultar controles para la captura
      const elementoSeleccionadoAntes = selectedId;
      setSelectedId(null);
      setImageEditMode(false);
      await new Promise((r) => requestAnimationFrame(r));

      const stage = stageRef.current;
      const imagen = stage.toDataURL({ mimeType: 'image/png', quality: 1 });

      // Restaurar selección
      setSelectedId(elementoSeleccionadoAntes);
      if (elementoSeleccionadoAntes) {
        const elemento = elementos.find((el) => el.id === elementoSeleccionadoAntes);
        if (elemento?.type === 'image') setImageEditMode(true);
      }

      const nombre = prompt(
        "Ingresa un nombre para tu diseño:",
        `Diseño ${objetoSeleccionado.articulo_nombre} ${new Date().toLocaleDateString()}`
      );
      if (!nombre) return null;

      const diseno = {
        nombre,
        articulo_id: objetoSeleccionado.articulo_id,
        imagen,
        elementos: elementos,
        variantes: objetoSeleccionado.variantes || [],
      };

      const res = await disenosService.guardarDiseno(diseno);
      alert("Diseño guardado exitosamente");
      return res?.id ?? null;
    } catch (error) {
      console.error("Error al guardar diseño:", error);
      alert("Error al guardar el diseño: " + (error?.response?.data?.error || error.message));
      return null;
    } finally {
      setGuardandoDiseno(false);
    }
  };

  const saveAndAddToCart = async () => {
    const designId = await saveDesign();
    if (!designId) return;
    try {
      await cartService.addItem({ id: objetoSeleccionado.articulo_id }, 1, { designId });
      alert("Diseño agregado al carrito");
    } catch (e) {
      console.error("Error al agregar al carrito", e);
      alert("No se pudo agregar al carrito");
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
      {selectedId && (
        <div className="edit-panel-column">
          <div className="edit-panel-sidebar">
            {!imageEditMode ? (
              <>
                <div className="sidebar-section">
                  <strong>📝 Editar Texto</strong>
                  <label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "4px" }}>Contenido:</div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={textInputValue}
                      onChange={handleTextInputChange}
                      style={{ width: "100%" }}
                      placeholder="Escribe tu texto aquí"
                    />
                  </label>

                  <label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "4px" }}>Tamaño:</div>
                    <input
                      type="number"
                      value={textStyle.fontSize}
                      min="8"
                      max="100"
                      onChange={(e) => {
                        const fontSize = parseInt(e.target.value) || 16;
                        setTextStyle({ ...textStyle, fontSize });
                        actualizarElemento(selectedId, { fontSize });
                      }}
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "4px" }}>Color:</div>
                    <input
                      type="color"
                      value={textStyle.fill}
                      onChange={(e) => {
                        const fill = e.target.value;
                        setTextStyle({ ...textStyle, fill });
                        actualizarElemento(selectedId, { fill });
                      }}
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "4px" }}>Fuente:</div>
                    <select
                      value={textStyle.fontFamily}
                      onChange={(e) => {
                        const fontFamily = e.target.value;
                        setTextStyle({ ...textStyle, fontFamily });
                        actualizarElemento(selectedId, { fontFamily });
                      }}
                      style={{ width: "100%" }}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </label>

                  <label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "4px" }}>Estilo:</div>
                    <select
                      value={textStyle.fontStyle}
                      onChange={(e) => {
                        const fontStyle = e.target.value;
                        setTextStyle({ ...textStyle, fontStyle });
                        actualizarElemento(selectedId, { fontStyle });
                      }}
                      style={{ width: "100%" }}
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Negrita</option>
                      <option value="italic">Cursiva</option>
                    </select>
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="sidebar-section">
                  <strong>🖼️ Editar Imagen</strong>
                  <label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "4px" }}>Ancho:</div>
                    <input
                      type="number"
                      value={imageDimensions.width}
                      min="20"
                      max="400"
                      onChange={(e) => {
                        const width = parseInt(e.target.value) || 100;
                        actualizarDimensionesImagen(selectedId, width, imageDimensions.height);
                      }}
                      style={{ width: "100%" }}
                    />
                  </label>
                  <label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "4px" }}>Alto:</div>
                    <input
                      type="number"
                      value={imageDimensions.height}
                      min="20"
                      max="500"
                      onChange={(e) => {
                        const height = parseInt(e.target.value) || 100;
                        actualizarDimensionesImagen(selectedId, imageDimensions.width, height);
                      }}
                      style={{ width: "100%" }}
                    />
                  </label>
                  <label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "4px" }}>Rotación (°):</div>
                    <input
                      type="number"
                      value={Math.round(currentImageRotation)}
                      min="0"
                      max="360"
                      step="1"
                      onChange={(e) => {
                        let rotation = parseInt(e.target.value) || 0;
                        // Normalizar a rango 0-360
                        if (rotation < 0) rotation = 0;
                        if (rotation > 360) rotation = 360;
                        actualizarRotacionImagen(selectedId, rotation);
                      }}
                      style={{ width: "100%" }}
                    />
                  </label>
                </div>
              </>
            )}

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
          </div>
        </div>
      )}

      <CanvasDiseño
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        imagenesVistas={imagenesVistas}
        vistaActual={vistaActual}
        elementos={elementos}
        selectedId={selectedId}
        stageRef={stageRef}
        onSelectElement={handleSelectElement}
        onUpdateElement={actualizarElemento}
        onDeselect={() => setSelectedId(null)}
        onSyncTextState={sincronizarEstadoTexto}
        onSyncImageState={sincronizarEstadoImagen}
      />

      <SidebarDiseño
        loading={loading}
        todosLosObjetos={todosLosObjetos}
        objetoSeleccionado={objetoSeleccionado}
        diseniosBase={diseniosBase}
        vistaActual={vistaActual}
        selectedId={selectedId}
        elementos={elementos}
        guardandoDiseno={guardandoDiseno}
        disenoIdActual={disenoIdActual}
        nombreDisenoActual={nombreDisenoActual}
        onObjetoSelect={handleObjetoSelect}
        onCambiarVista={cambiarVista}
        onAgregarTexto={agregarTexto}
        onAgregarImagen={agregarImagen}
        onHandleImageUpload={handleImageUpload}
        onEliminarElemento={eliminarElemento}
        onDuplicarElemento={duplicarElemento}
        onCaptureAndUploadViews={captureAndUploadViews}
        onSaveAndAddToCart={saveAndAddToCart}
      />
    </div>
  );
};

export default HerramientaDiseño;