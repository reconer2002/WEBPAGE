import React, { useMemo, useState } from "react";
import { generarNombreObjeto } from "../../utils/disenoHelpers";

const SidebarDiseño = ({
  loading,
  todosLosObjetos,
  objetoSeleccionado,
  diseniosBase,
  vistaActual,
  selectedId,
  elementos,
  guardandoDiseno,
  agregandoAlCarrito,
  disenoIdParaEditar,
  nombreDisenoActual,
  onObjetoSelect,
  onCambiarVista,
  onAgregarTexto,
  onAgregarImagen,
  onHandleImageUpload,
  onEliminarElemento,
  onDuplicarElemento,
  onCaptureAndUploadViews,
  onSaveAndAddToCart
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredObjetos = useMemo(() => {
    if (!searchTerm || !todosLosObjetos) return todosLosObjetos || [];
    const q = searchTerm.trim().toLowerCase();
    return todosLosObjetos.filter((objeto) => {
      const disenioBase = diseniosBase.find((d) => d.id === objeto.disenio_base_id);
      const nombreObjeto = generarNombreObjeto(objeto).toLowerCase();
      const articuloNombre = (objeto.articulo_nombre || "").toLowerCase();
      const disenioNombre = (disenioBase?.nombre || "").toLowerCase();
      return (
        nombreObjeto.includes(q) ||
        articuloNombre.includes(q) ||
        disenioNombre.includes(q) ||
        String(objeto.id).includes(q)
      );
    });
  }, [searchTerm, todosLosObjetos, diseniosBase]);

  const handleAgregarAlCarrito = () => {
    // Delegar al manejador provisto por el hook (guardado + cart backend)
    if (typeof onSaveAndAddToCart === 'function') {
      onSaveAndAddToCart();
      return;
    }
    if (typeof onCaptureAndUploadViews === 'function') {
      // Si solo tenemos el guardado, guardamos primero y luego que el usuario vaya a "Tus Diseños"
      onCaptureAndUploadViews();
    }
  };
  return (
    <div className="options-column">
      <div className="herramienta-diseño-sidebar">
        <div className="sidebar">
          <h3>Herramienta de Diseño</h3>

          {disenoIdParaEditar && nombreDisenoActual && (
            <div style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '8px',
              marginBottom: '12px',
              color: 'white',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>✏️ Editando diseño:</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{nombreDisenoActual}</div>
            </div>
          )}

          <div className="sidebar-section">
            <strong>Añadir Elementos</strong>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button className="add-btn" onClick={onAgregarTexto}>
                📝 Texto
              </button>
              <label className="add-btn" style={{ cursor: "pointer", display: "inline-block" }}>
                🖼️ Imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={onHandleImageUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

        {loading ? (
          <div className="sidebar-section"><div className="loading-state"><p>Cargando objetos...</p></div></div>
        ) : (todosLosObjetos?.length === 0) ? (
          <div className="sidebar-section"><div className="loading-state"><p>No hay objetos disponibles</p></div></div>
        ) : (
          <>
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

            {objetoSeleccionado && (
              <div className="sidebar-section">
                <strong>Vista del Objeto</strong>
                <div className="size-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button 
                    className={`size-btn ${vistaActual === 'frente' ? 'active' : ''}`} 
                    onClick={() => onCambiarVista('frente')}
                    title="Vista frontal"
                  >
                    👤 Frente
                  </button>
                  <button 
                    className={`size-btn ${vistaActual === 'detras' ? 'active' : ''}`} 
                    onClick={() => onCambiarVista('detras')}
                    title="Vista trasera"
                  >
                    🔄 Detrás
                  </button>
                  <button 
                    className={`size-btn ${vistaActual === 'izquierda' ? 'active' : ''}`} 
                    onClick={() => onCambiarVista('izquierda')}
                    title="Vista lateral izquierda"
                  >
                    ⬅️ Izquierda
                  </button>
                  <button 
                    className={`size-btn ${vistaActual === 'derecha' ? 'active' : ''}`} 
                    onClick={() => onCambiarVista('derecha')}
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

            <div className="sidebar-section">
              <strong>Objetos Disponibles</strong>

              <div className="object-search" style={{ margin: "8px 0 12px 0", display: "flex", gap: 8 }}>
                <input
                  placeholder="Buscar objetos (nombre, artículo, diseño)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="action-button" style={{ padding: "8px 10px" }}>
                    Limpiar
                  </button>
                )}
              </div>

              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{filteredObjetos.length} resultado(s)</div>

              <div className="objects-grid">
                {filteredObjetos.map((objeto) => {
                  const selected = objetoSeleccionado?.id === objeto.id;
                  const disenioBase = diseniosBase.find(d => d.id === objeto.disenio_base_id);
                  
                  const nombreObjeto = generarNombreObjeto(objeto);
                  
                  return (
                    <div 
                      key={objeto.id} 
                      className={`object-item ${selected ? "selected" : ""}`} 
                      onClick={() => onObjetoSelect(objeto)}
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
                onClick={() => onCaptureAndUploadViews()} 
                style={{ 
                  width: "100%", 
                  marginBottom: "8px",
                  opacity: (objetoSeleccionado && !guardandoDiseno) ? 1 : 0.5 
                }}
                disabled={!objetoSeleccionado || guardandoDiseno}
              >
                {guardandoDiseno 
                  ? (disenoIdParaEditar ? "🔄 Actualizando..." : "🔄 Guardando...") 
                  : (disenoIdParaEditar ? "✓ Actualizar diseño" : "💾 Guardar diseño")}
              </button>
              
              <button 
                className="cart-btn" 
                onClick={handleAgregarAlCarrito}
                style={{ 
                  width: "100%",
                  opacity: (objetoSeleccionado && !agregandoAlCarrito) ? 1 : 0.5 
                }}
                disabled={!objetoSeleccionado || agregandoAlCarrito}
              >
                🛒 Agregar al carrito
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default SidebarDiseño;
