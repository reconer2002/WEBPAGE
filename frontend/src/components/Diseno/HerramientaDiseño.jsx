import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Text, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import "./HerramientaDiseño.css";
import articulosService from "../../services/articulosService";
import variantesService from "../../services/variantesService";
import ImagenElemento from "./ImagenElemento";

const HerramientaDiseño = () => {
  const [canvasWidth] = useState(400);
  const [canvasHeight] = useState(500);
  const [elementos, setElementos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [variantesSeleccionadas, setVariantesSeleccionadas] = useState({});
  const [loading, setLoading] = useState(true);

  const stageRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const [textInputValue, setTextInputValue] = useState("");
  const [textStyle, setTextStyle] = useState({ fontSize: 20, fill: "#000000", fontFamily: "Arial", fontStyle: "normal" });
  const [imageEditMode, setImageEditMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingArticulo, setPendingArticulo] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 100, height: 100 });

  const [baseImage] = useImage(articuloSeleccionado?.foto || "");

  useEffect(() => {
    const fetchArticulos = async () => {
      try {
        setLoading(true);
        const articulosData = await articulosService.getArticulos();
        setArticulos(articulosData);
        if (articulosData.length > 0) {
          const primerArticulo = articulosData[0];
          setArticuloSeleccionado(primerArticulo);
          const variantesData = await variantesService.getVariantes(primerArticulo.id);
          setVariantes(variantesData);
        }
      } catch (error) {
        console.error("Error al cargar artículos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticulos();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;
      const selectedElement = elementos.find((el) => el.id === selectedId);
      if (!selectedElement) return;
      if (selectedElement.type === "text" && document.activeElement === inputRef.current) return;

      switch (e.key) {
        case "Delete":
        case "Backspace":
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
  }, [selectedId, elementos]);

  const agregarTexto = () => {
    const nuevoTexto = { id: Date.now(), type: "text", x: 50, y: 50, text: "Texto", fontSize: 20, fill: "#000000", fontFamily: "Arial", fontStyle: "normal", rotation: 0, scale: 1 };
    setElementos((prev) => [...prev, nuevoTexto]);
  };

  const agregarImagen = (url) => {
    const nuevaImagen = { id: Date.now(), type: "image", x: 50, y: 50, url, width: 100, height: 100, rotation: 0, draggable: true };
    setElementos((prev) => [...prev, nuevaImagen]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }
    const url = URL.createObjectURL(file);
    agregarImagen(url);
    e.target.value = "";
  };

  const handleArticuloChange = async (articulo) => {
    try {
      if (articuloSeleccionado?.id === articulo.id) return;
      if (elementos.length > 0) {
        setPendingArticulo(articulo);
        setShowConfirmModal(true);
        return;
      }
      setArticuloSeleccionado(articulo);
      setVariantesSeleccionadas({});
      const variantesData = await variantesService.getVariantes(articulo.id);
      setVariantes(variantesData);
    } catch (error) {
      console.error("Error al cargar variantes:", error);
    }
  };

  const confirmChangeAndClear = async () => {
    if (!pendingArticulo) return;
    try {
      setElementos([]);
      setSelectedId(null);
      setArticuloSeleccionado(pendingArticulo);
      setVariantesSeleccionadas({});
      const variantesData = await variantesService.getVariantes(pendingArticulo.id);
      setVariantes(variantesData);
    } catch (error) {
      console.error(error);
    } finally {
      setShowConfirmModal(false);
      setPendingArticulo(null);
    }
  };

  const confirmChangeKeep = async () => {
    if (!pendingArticulo) return;
    try {
      setArticuloSeleccionado(pendingArticulo);
      setVariantesSeleccionadas({});
      const variantesData = await variantesService.getVariantes(pendingArticulo.id);
      setVariantes(variantesData);
    } catch (error) {
      console.error(error);
    } finally {
      setShowConfirmModal(false);
      setPendingArticulo(null);
    }
  };

  const handleVarianteSelect = (categoria, variante) => {
    setVariantesSeleccionadas((prev) => ({ ...prev, [categoria]: variante }));
  };

  const variantesPorCategoria = variantes.reduce((acc, variante) => {
    const categoria = variante.categoria || variante.nombre_categoria;
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(variante);
    return acc;
  }, {});

  const captureAndUploadViews = () => {
    console.log("Guardando diseño...", { articulo: articuloSeleccionado, variantes: variantesSeleccionadas, elementos });
    alert("Diseño guardado (funcionalidad en desarrollo)");
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
    }
  };

  const handleTextInputChange = (e) => {
    setTextInputValue(e.target.value);
    actualizarElemento(selectedId, { text: e.target.value });
  };

  return (
    <div className="herramienta-diseño-container centered-layout">
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
                          onTransformEnd={(e) => {
                            const node = e.target;
                            const scaleX = node.scaleX();
                            const scaleY = node.scaleY();
                            node.scaleX(1);
                            node.scaleY(1);
                            const newFontSize = Math.max(8, Math.round(el.fontSize * Math.max(scaleX, scaleY)));
                            const newRotation = node.rotation();
                            actualizarElemento(el.id, { x: node.x(), y: node.y(), rotation: newRotation, fontSize: newFontSize, scale: 1 });
                            if (isSelected) setTextStyle((prev) => ({ ...prev, fontSize: newFontSize }));
                          }}
                          onDblClick={() => handleSelectElement(el)}
                          onClick={() => handleSelectElement(el)}
                        />
                        {isSelected && (
                          <Transformer rotateEnabled={false} enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)} />
                        )}
                      </React.Fragment>
                    );
                  }
                  if (el.type === "image") {
                    return <ImagenElemento key={el.id} el={el} onUpdate={actualizarElemento} isSelected={selectedId === el.id} onSelect={() => handleSelectElement(el)} />;
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
            <button onClick={agregarTexto}>Agregar texto</button>
            <label className="image-upload-btn">🖼️ Agregar imagen
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
            </label>
          </div>

          {loading ? (
            <div className="sidebar-section"><div className="loading-state"><p>Cargando artículos...</p></div></div>
          ) : articulos.length === 0 ? (
            <div className="sidebar-section"><div className="loading-state"><p>No hay artículos disponibles</p></div></div>
          ) : (
            <>
              <div className="sidebar-section">
                <strong>Artículos</strong>
                <div className="models-list">
                  {articulos.map((articulo) => {
                    const selected = articuloSeleccionado?.id === articulo.id;
                    return (
                      <div key={articulo.id} className={`model-card ${selected ? "selected" : ""}`} onClick={() => handleArticuloChange(articulo)} title={articulo.nombre}>
                        {articulo.nombre.substring(0, 8)}{articulo.nombre.length > 8 ? "..." : ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              {articuloSeleccionado && (
                <div className="sidebar-section">
                  <strong>Producto Seleccionado</strong>
                  <div style={{ fontSize: 13, color: "#475569" }}>
                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>{articuloSeleccionado.nombre}</div>
                    <div style={{ color: "#059669", fontWeight: "bold" }}>${Number(articuloSeleccionado.precio).toLocaleString()}</div>
                    {articuloSeleccionado.descripcion && <div style={{ marginTop: 4, fontSize: 12 }}>{articuloSeleccionado.descripcion}</div>}
                  </div>
                </div>
              )}

              {Object.entries(variantesPorCategoria).map(([categoria, variantesCategoria]) => (
                <div key={categoria} className="sidebar-section">
                  <strong>{categoria.charAt(0).toUpperCase() + categoria.slice(1)}</strong>
                  <div className={variantesCategoria.some((v) => v.imagen) ? "variant-grid" : "size-list"}>
                    {variantesCategoria.map((variante) => {
                      const selected = variantesSeleccionadas[categoria]?.id === variante.id;
                      if (variante.imagen) {
                        return (
                          <div key={variante.id} className={`variant-item ${selected ? "selected" : ""}`} onClick={() => handleVarianteSelect(categoria, variante)} title={`${variante.valor} - ${variante.nombre_categoria}`}>
                            <img src={variante.imagen} alt={variante.valor} />
                            <span style={{ fontSize: 11, textAlign: "center" }}>{variante.valor}</span>
                          </div>
                        );
                      }
                      return (
                        <button key={variante.id} className={`size-btn ${selected ? "active" : ""}`} onClick={() => handleVarianteSelect(categoria, variante)} title={`${variante.valor} - ${variante.nombre_categoria}`}>
                          {variante.valor || variante.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="sidebar-section">
                <button className="save-btn" onClick={captureAndUploadViews} style={{ width: "100%" }}>💾 Guardar diseño</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Paneles centrados */}
      {selectedId && (
        <>
          {!imageEditMode ? (
            <>
              <div className="centered-panel-overlay" onMouseDown={() => setSelectedId(null)} />
              <div className="centered-panel" onMouseDown={(e) => e.stopPropagation()} ref={panelRef}>
                <input ref={inputRef} className="centered-text-input" style={{ width: "100%", fontSize: textStyle.fontSize + "px", color: textStyle.fill }} value={textInputValue} onChange={handleTextInputChange} autoFocus placeholder="Escribe texto..." />

                <div className="text-style-panel-bubble" style={{ marginTop: 12 }}>
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

                  <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "6px" }}>Posición y capas:</div>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <button onClick={() => cambiarCapaElemento(selectedId, "arriba")} className="layer-button" title="Traer al frente">↑ Frente</button>
                      <button onClick={() => cambiarCapaElemento(selectedId, "abajo")} className="layer-button" title="Enviar atrás">↓ Atrás</button>
                    </div>
                    <div className="keyboard-hint">Rotación deshabilitada para texto</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="centered-panel-overlay" onMouseDown={() => setSelectedId(null)} />
              <div className="centered-panel" onMouseDown={(e) => e.stopPropagation()} ref={panelRef}>
                <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: "8px", color: "#374151" }}>🖼️ Editar Imagen</div>
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

                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: "6px" }}>Posición y capas:</div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <button onClick={() => cambiarCapaElemento(selectedId, "arriba")} className="layer-button" title="Traer al frente">↑ Frente</button>
                    <button onClick={() => cambiarCapaElemento(selectedId, "abajo")} className="layer-button" title="Enviar atrás">↓ Atrás</button>
                  </div>
                  <div className="keyboard-hint">Arrastra las esquinas para redimensionar</div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Modal */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>Cambiar artículo</div>
            <div style={{ color: "#374151", marginBottom: 12 }}>Hay elementos en el diseño. ¿Qué deseas hacer con ellos?</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowConfirmModal(false); setPendingArticulo(null); }} style={{ padding: "6px 10px" }}>Cancelar</button>
              <button onClick={confirmChangeKeep} style={{ padding: "6px 10px", background: "#2563eb", color: "#fff", border: 0, borderRadius: 6 }}>Mantener</button>
              <button onClick={confirmChangeAndClear} style={{ padding: "6px 10px", background: "#ef4444", color: "#fff", border: 0, borderRadius: 6 }}>Borrar y cargar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HerramientaDiseño;