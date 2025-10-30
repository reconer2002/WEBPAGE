import React from "react";
import "./HerramientaDiseño.css";
import { useHerramientaDiseño } from "./hooks/useHerramientaDiseño";
import CanvasDiseño from "./components/Canvas/CanvasDiseño";
import SidebarDiseño from "./components/Sidebar/SidebarDiseño";

// --- 🛑 1. IMPORTA TU ARCHIVO DE ANALYTICS ---
// (Asegúrate de que esta ruta sea la correcta para tu proyecto)
import { Analytics } from "../../services/analytics";

const HerramientaDiseño = ({ onDisenoGuardado, editingId = null, initialElements = null, initialObjeto = null, initialNombre = '', initialElementsByView = null }) => {

  // --- 🛑 2. CREA LA FUNCIÓN "WRAPPER" ---
  // Esta función interceptará el guardado exitoso
  const handleDisenoGuardadoWrapper = (datosGuardados) => {
    
    // (Dejamos este console.log para que puedas depurar)
    console.log("--- 🛑 ENVIANDO EVENTO 'save_design' A GA ---", {
      label: datosGuardados?.nombre || initialNombre || (editingId ? "Design Edit" : "Design Create")
    });

    // Envía el evento a Google Analytics
    Analytics.trackEvent("save_design", {
      category: "Design",
      label: datosGuardados?.nombre || initialNombre || (editingId ? "Design Edit" : "Design Create"),
      // (Opcional) si tienes el ID del artículo:
      // item_id: datosGuardados?.articuloId || initialObjeto?.id,
    });

    // Llama a la función original (la que te redirige)
    if (onDisenoGuardado) {
      onDisenoGuardado(datosGuardados);
    }
  };


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
  } = useHerramientaDiseño(
    // --- 🛑 3. PASA LA NUEVA FUNCIÓN "WRAPPER" AL HOOK ---
    handleDisenoGuardadoWrapper, 
    { editingId, initialElements, initialObjeto, initialNombre, initialElementsByView }
  );

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
                  {/* ... (todo tu código de editar texto) ... */}
                </div>
              </>
            ) : (
              <>
                <div className="sidebar-section">
                  <strong>🖼️ Editar Imagen</strong>
                  {/* ... (todo tu código de editar imagen) ... */}
                </div>
              </>
            )}

            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
              {/* ... (todo tu código de posición y capas) ... */}
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