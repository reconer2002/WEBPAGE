import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./DisenosGuardados.css";
import disenosService from "../../services/disenosService";
import cartService from "../../services/cartService";
import objetosService from "../../services/objetosService";
import diseniosBaseService from "../../services/diseniosBaseService";
import articulosService from "../../services/articulosService";

const DisenosGuardados = () => {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDiseno, setSelectedDiseno] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [tempVista, setTempVista] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Effect para generar preview cuando se abre el modal
  useEffect(() => {
    if (editModalOpen && selectedDiseno && tempVista && canvasRef.current) {
      // Pequeño delay para asegurar que el canvas esté completamente montado
      const timer = setTimeout(() => {
        generarPreviewVista(tempVista);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editModalOpen, selectedDiseno, tempVista]);

  useEffect(() => {
    const cargarDisenos = async () => {
      try {
        setLoading(true);
        const disenosData = await disenosService.getDisenos();
        setDisenos(disenosData);
      } catch (error) {
        console.error("Error al cargar diseños:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDisenos();
  }, []);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
  const resolveImage = (primary, fallback) => {
    const u =
      (primary && String(primary).trim()) ||
      (fallback && String(fallback).trim()) ||
      "";
    if (!u) return "";
    if (/^(https?:)?\/\//i.test(u) || u.startsWith("data:")) return u;
    if (u.startsWith("/img/")) return `${BACKEND_URL}${u}`;
    return u;
  };

  const parseJsonSafe = (val) => {
    try {
      if (!val) return null;
      if (typeof val === "object") return val;
      return JSON.parse(val);
    } catch {
      return null;
    }
  };

  const makePlaceholder = (diseno) => {
    const elementos = parseJsonSafe(diseno.elementos) || [];
    const variantes = parseJsonSafe(diseno.variantes) || {};
    const mainText = Array.isArray(elementos)
      ? (elementos.find((e) => e?.type === "text")?.text || diseno?.nombre || "Diseño")
      : (diseno?.nombre || "Diseño");
    const vista = variantes?.vista ? String(variantes.vista) : "frente";
    const precio = variantes?.precio ? `$${Number(variantes.precio).toLocaleString("es-CL")}` : "";
    const cantidad = variantes?.cantidad ? `x${variantes.cantidad}` : "";
    const subtitle = [vista, cantidad, precio].filter(Boolean).join(" · ");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
  <defs>
    <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffd1dc"/>
      <stop offset="100%" stop-color="#ff678f"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g>
    <rect x="110" y="60" rx="16" ry="16" width="380" height="280" fill="#ff2b5a" opacity="0.85" />
    <text x="300" y="140" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#6b0000" font-weight="700">${(mainText || "").slice(0, 18)}</text>
    <text x="300" y="175" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#ffffff" opacity="0.9">${subtitle}</text>
  </g>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handleUpdateVista = (nuevaVista) => {
    if (!selectedDiseno) return;
    setTempVista(nuevaVista);
    // Esperar un frame para asegurar que el estado se haya actualizado
    setTimeout(() => generarPreviewVista(nuevaVista), 50);
  };

  const generarPreviewVista = async (vista) => {
    if (!selectedDiseno || !canvasRef.current) return;
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 500;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Cargar datos necesarios
      const objetos = await objetosService.getObjetos(selectedDiseno.articulo_id);
      const diseniosBase = await diseniosBaseService.getAll();
      
      const objeto = objetos.find(o => o.id === selectedDiseno.objeto_id);
      if (!objeto) return;
      
      const disenioBase = diseniosBase.find(d => d.id === objeto.disenio_base_id);
      if (!disenioBase) return;
      
      // Mapear la vista al campo correcto en la base de datos
      const vistaMap = {
        'frente': 'frente',
        'detras': 'espalda',
        'izquierda': 'izquierda',
        'derecha': 'derecha'
      };
      
      const vistaKey = vistaMap[vista];
      const imagenVista = disenioBase[vistaKey];
      
      if (!imagenVista) return;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Obtener elementos de la vista correctamente
        let elementos = [];
        if (selectedDiseno.elementos_por_vista && typeof selectedDiseno.elementos_por_vista === 'object') {
          elementos = selectedDiseno.elementos_por_vista[vista] || [];
        }
        
        let imagenesRestantes = elementos.filter(el => el.type === 'image').length;
        
        elementos.forEach(el => {
          if (el.type === 'text') {
            ctx.save();
            // Para texto, rotar desde la esquina superior izquierda (comportamiento de Konva por defecto)
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
              // Para imágenes, Konva rota desde la esquina superior izquierda por defecto
              // (a menos que se especifique offset, que no usamos)
              ctx.translate(el.x, el.y);
              ctx.rotate((el.rotation || 0) * Math.PI / 180);
              ctx.drawImage(imgEl, 0, 0, el.width, el.height);
              ctx.restore();
              
              imagenesRestantes--;
              if (imagenesRestantes === 0) {
                setPreviewImage(canvas.toDataURL());
              }
            };
            imgEl.onerror = () => {
              imagenesRestantes--;
              if (imagenesRestantes === 0) {
                setPreviewImage(canvas.toDataURL());
              }
            };
            imgEl.src = el.url;
          }
        });
        
        // Si no hay imágenes, actualizar preview inmediatamente
        if (imagenesRestantes === 0) {
          setPreviewImage(canvas.toDataURL());
        }
      };
      
      img.onerror = () => {};
      
      const imgUrl = imagenVista.startsWith('http') ? imagenVista : `${BACKEND_URL}${imagenVista}`;
      img.src = imgUrl;
      
    } catch (error) {
      // Error silencioso
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedDiseno) return;
    
    try {
      // Usar el preview generado si existe, sino mantener el anterior
      const nuevaImagenPreview = previewImage || selectedDiseno.imagen_preview;
      
      const updates = {
        nombre: editingName,
        objeto_id: selectedDiseno.objeto_id,
        elementos_por_vista: selectedDiseno.elementos_por_vista,
        vista_actual: tempVista,
        imagen_preview: nuevaImagenPreview,
        costo: selectedDiseno.costo
      };
      
      await disenosService.actualizarDiseno(selectedDiseno.id, updates);
      
      // Actualizar la lista de diseños con todos los cambios, incluyendo la nueva imagen
      setDisenos(disenos.map(d => 
        d.id === selectedDiseno.id ? { 
          ...d, 
          nombre: editingName, 
          vista_actual: tempVista,
          imagen: nuevaImagenPreview // Actualizar la imagen en la tarjeta
        } : d
      ));
      
      setEditModalOpen(false);
      setSelectedDiseno(null);
      setPreviewImage(null);
    } catch (error) {
      console.error('Error al actualizar diseño:', error);
      alert('Error al actualizar el diseño');
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedDiseno(null);
    setTempVista('');
    setPreviewImage(null);
  };

  const handleDeleteDiseno = async () => {
    if (!selectedDiseno) return;
    
    try {
      await disenosService.eliminarDiseno(selectedDiseno.id);
      setDisenos(disenos.filter((d) => d.id !== selectedDiseno.id));
      setDeleteModalOpen(false);
      setSelectedDiseno(null);
    } catch (error) {
      console.error('Error al eliminar diseño:', error);
      alert('Error al eliminar el diseño');
    }
  };

  return (
    <div className="disenos-guardados">
      <h2>Tus Diseños Guardados</h2>

      {loading ? (
        <div className="disenos-loading">
          <p>Cargando diseños...</p>
        </div>
      ) : disenos.length === 0 ? (
        <div className="disenos-empty">
          <p>No tienes diseños guardados</p>
          <button
            className="crear-diseno-btn"
            onClick={() => navigate("/disenos/crear")}
          >
            Crear nuevo diseño
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button
              className="crear-diseno-btn"
              onClick={() => navigate("/disenos/crear")}
            >
              ➕ Crear nuevo diseño
            </button>
          </div>
          <div className="disenos-grid">
          {disenos.map((diseno) => (
            <div key={diseno.id} className="diseno-card">
              <div className="diseno-imgbox">
              <img
                src={
                  resolveImage(diseno.imagen, diseno.articulo_imagen) ||
                  makePlaceholder(diseno)
                }
                alt={diseno.nombre}
                onError={(e) => {
                  const fallback =
                    resolveImage(diseno.articulo_imagen, "/img/Logo.png") ||
                    makePlaceholder(diseno);
                  if (e.currentTarget.src !== fallback && fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
              </div>
              <div className="diseno-info">
                <h3>{diseno.nombre}</h3>
                <p>{diseno.articulo_nombre}</p>
                <p style={{ margin: 0, color: "#0f766e", fontWeight: 600 }}>
                  Stock: {diseno.stock ?? "—"}
                </p>
                {diseno.fecha_modificacion && (
                  <p className="fecha" style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    {(() => {
                      const d = new Date(diseno.fecha_modificacion);
                      return isNaN(d) ? "" : `Modificado: ${d.toLocaleDateString()}`;
                    })()}
                  </p>
                )}
              </div>
              <div className="diseno-actions">
                <button
                  className="editar-btn"
                  onClick={async () => {
                    try {
                      const disenoCompleto = await disenosService.getDiseno(diseno.id);
                      
                      setSelectedDiseno(disenoCompleto);
                      setEditingName(disenoCompleto.nombre);
                      const vistaInicial = disenoCompleto.vista_actual || 'frente';
                      setTempVista(vistaInicial);
                      setPreviewImage(null);
                      setEditModalOpen(true);
                      // El useEffect se encargará de generar el preview
                    } catch (error) {
                      console.error('Error al cargar diseño:', error);
                      alert('Error al cargar el diseño');
                    }
                  }}
                >
                  Editar
                </button>
                <button
                  className="agregar-btn"
                  onClick={async () => {
                    try {
                      setAddingId(diseno.id);
                      await cartService.addItem(
                        { id: diseno.articulo_id },
                        1,
                        { customImage: diseno.imagen, designId: diseno.id }
                      );
                      // Éxito silencioso: el contador del carrito se actualiza vía evento
                    } catch (error) {
                      console.error("Error al agregar al carrito:", error);
                      const msg =
                        error.response?.data?.error ||
                        error.message ||
                        "Error al agregar al carrito";
                      alert(msg);
                    } finally {
                      setAddingId(null);
                    }
                  }}
                  disabled={addingId === diseno.id}
                >
                  Agregar al carrito
                </button>
                <button
                  className="eliminar-btn"
                  onClick={() => {
                    setSelectedDiseno(diseno);
                    setDeleteModalOpen(true);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {editModalOpen && selectedDiseno && (
        <div className="modal-backdrop" onClick={handleCloseEditModal}>
          <div className="modal-card edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Opciones de Diseño</h3>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>✕</button>
            </div>
            <div className="modal-body">
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="edit-preview">
                <img
                  src={previewImage || resolveImage(selectedDiseno.imagen_preview, selectedDiseno.articulo_imagen) || makePlaceholder(selectedDiseno)}
                  alt={selectedDiseno.nombre}
                  onError={(e) => {
                    const fallback = resolveImage(selectedDiseno.articulo_imagen) || makePlaceholder(selectedDiseno);
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
              </div>
              <div className="edit-option">
                <label>Nombre del diseño:</label>
                <input
                  type="text"
                  className="modal-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Nombre del diseño"
                />
              </div>
              <div className="edit-option">
                <label>Vista por defecto:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button 
                    className={`vista-btn ${tempVista === 'frente' ? 'active' : ''}`}
                    onClick={() => handleUpdateVista('frente')}
                    key={`frente-${tempVista}`}
                  >
                    👤 Frente
                  </button>
                  <button 
                    className={`vista-btn ${tempVista === 'detras' ? 'active' : ''}`}
                    onClick={() => handleUpdateVista('detras')}
                    key={`detras-${tempVista}`}
                  >
                    🔄 Detrás
                  </button>
                  <button 
                    className={`vista-btn ${tempVista === 'izquierda' ? 'active' : ''}`}
                    onClick={() => handleUpdateVista('izquierda')}
                    key={`izquierda-${tempVista}`}
                  >
                    ⬅️ Izquierda
                  </button>
                  <button 
                    className={`vista-btn ${tempVista === 'derecha' ? 'active' : ''}`}
                    onClick={() => handleUpdateVista('derecha')}
                    key={`derecha-${tempVista}`}
                  >
                    ➡️ Derecha
                  </button>
                </div>
              </div>
              <div className="edit-option">
                <button 
                  className="option-btn edit-in-tool-btn"
                  onClick={() => {
                    setEditModalOpen(false);
                    navigate(`/disenos/editar/${selectedDiseno.id}`);
                  }}
                >
                  🎨 Editar diseño en herramienta
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={handleCloseEditModal}>
                Cancelar
              </button>
              <button 
                className="modal-btn modal-btn-primary"
                onClick={handleSaveChanges}
                disabled={!editingName.trim()}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && selectedDiseno && (
        <div className="modal-backdrop" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-card delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header error">
              <div className="modal-icon">⚠</div>
              <h3>¿Eliminar diseño?</h3>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                ¿Estás seguro de que deseas eliminar el diseño <strong>"{selectedDiseno.nombre}"</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={() => setDeleteModalOpen(false)}>
                Cancelar
              </button>
              <button className="modal-btn modal-btn-danger" onClick={handleDeleteDiseno}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisenosGuardados;