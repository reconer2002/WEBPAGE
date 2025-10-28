import React from "react";
import "./HerramientaDiseño.css";
import { useHerramientaDiseño } from "./hooks/useHerramientaDiseño";
import CanvasDiseño from "./components/Canvas/CanvasDiseño";
import SidebarDiseño from "./components/Sidebar/SidebarDiseño";

const HerramientaDiseño = ({ onDisenoGuardado, editingId = null, initialElements = null, initialObjeto = null, initialNombre = '', initialElementsByView = null }) => {
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
  } = useHerramientaDiseño(onDisenoGuardado, { editingId, initialElements, initialObjeto, initialNombre, initialElementsByView });

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