import React, { useEffect, useState } from "react";
import {
  getTestimonios,
  crearTestimonio,
  actualizarTestimonio,
  borrarTestimonio,
} from "../../services/testimoniosService";
import "./Testimonios.css";

const Testimonios = () => {
  const [testimonios, setTestimonios] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    foto: null,
    calificacion: 5,
  });
  const [editando, setEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarTestimonios = async () => {
    try {
      setLoading(true);
      const data = await getTestimonios();
      setTestimonios(data);
    } catch (err) {
      console.error("Error al obtener testimonios:", err);
      mostrarMensaje('error', 'Error al cargar testimonios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTestimonios();
  }, []);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = new FormData();
      data.append("nombre", formData.nombre);
      data.append("descripcion", formData.descripcion);
      data.append("calificacion", formData.calificacion);
      if (formData.foto) data.append("foto", formData.foto);

      if (editando) {
        await actualizarTestimonio(editando, data);
        mostrarMensaje('success', 'Testimonio actualizado correctamente');
      } else {
        await crearTestimonio(data);
        mostrarMensaje('success', 'Testimonio creado correctamente');
      }

      setFormData({ nombre: "", descripcion: "", foto: null, calificacion: 5 });
      setEditando(null);
      setMostrarFormulario(false);
      setPreviewUrl(null);
      cargarTestimonios();
    } catch (err) {
      console.error("Error al guardar testimonio:", err);
      mostrarMensaje('error', 'Error al guardar el testimonio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await borrarTestimonio(id);
      setConfirmDelete(null);
      mostrarMensaje('success', 'Testimonio eliminado correctamente');
      cargarTestimonios();
    } catch (err) {
      console.error("Error al eliminar testimonio:", err);
      mostrarMensaje('error', 'Error al eliminar el testimonio');
    }
  };

  const handleEdit = (testimonio) => {
    setFormData({
      nombre: testimonio.nombre,
      descripcion: testimonio.descripcion,
      foto: null,
      calificacion: testimonio.calificacion || 5,
    });
    setPreviewUrl(testimonio.foto_url);
    setEditando(testimonio.id);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setFormData({ nombre: "", descripcion: "", foto: null, calificacion: 5 });
    setEditando(null);
    setMostrarFormulario(false);
    setPreviewUrl(null);
  };

  const renderEstrellas = (calificacion) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < calificacion ? "star filled" : "star"}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="testimonios-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando testimonios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="testimonios-container">
      <div className="testimonios-header">
        <div>
          <h2>💬 Gestión de Testimonios</h2>
          <p className="testimonios-subtitle">
            Administra los testimonios que aparecen en la página principal
          </p>
        </div>
        <button
          className="btn-nuevo"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? '✕ Cancelar' : '+ Nuevo Testimonio'}
        </button>
      </div>

      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.tipo === 'success' ? '✓' : '⚠'} {mensaje.texto}
        </div>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="formulario-card">
          <h3>{editando ? 'Editar Testimonio' : 'Nuevo Testimonio'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre del Cliente *</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre}
                  onChange={handleChange}
                  maxLength={50}
                  required
                />
                <span className="char-count">{formData.nombre.length}/50</span>
              </div>

              <div className="form-group">
                <label>Calificación *</label>
                <div className="calificacion-selector">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`star-btn ${formData.calificacion >= num ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, calificacion: num })}
                    >
                      ★
                    </button>
                  ))}
                  <span className="calificacion-text">{formData.calificacion} estrella{formData.calificacion !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Testimonio *</label>
                <textarea
                  name="descripcion"
                  placeholder="Escribe aquí la opinión del cliente..."
                  value={formData.descripcion}
                  onChange={handleChange}
                  maxLength={300}
                  rows={4}
                  required
                />
                <span className="char-count">{formData.descripcion.length}/300</span>
              </div>

              <div className="form-group full-width">
                <label>Foto del Cliente</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    name="foto"
                    id="foto-input"
                    accept="image/*"
                    onChange={handleChange}
                  />
                  <label htmlFor="foto-input" className="file-upload-label">
                    {previewUrl ? '📷 Cambiar foto' : '📷 Seleccionar foto'}
                  </label>
                  {previewUrl && (
                    <div className="preview-container">
                      <img src={previewUrl} alt="Preview" className="preview-image" />
                      <button
                        type="button"
                        className="remove-preview"
                        onClick={() => {
                          setPreviewUrl(null);
                          setFormData({ ...formData, foto: null });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancelar" onClick={handleCancelar}>
                Cancelar
              </button>
              <button type="submit" className="btn-guardar" disabled={saving}>
                {saving ? 'Guardando...' : (editando ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de testimonios */}
      <div className="testimonios-grid">
        {testimonios.length === 0 ? (
          <div className="empty-state">
            <p>📝 No hay testimonios registrados</p>
            <button className="btn-nuevo" onClick={() => setMostrarFormulario(true)}>
              Crear el primero
            </button>
          </div>
        ) : (
          testimonios.map((testimonio) => (
            <div key={testimonio.id} className="testimonio-card">
              <div className="testimonio-header">
                <div className="testimonio-avatar">
                  {testimonio.foto_url ? (
                    <img src={testimonio.foto_url} alt={testimonio.nombre} />
                  ) : (
                    <div className="avatar-placeholder">
                      {testimonio.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="testimonio-info">
                  <h4>{testimonio.nombre}</h4>
                  <div className="testimonio-rating">
                    {renderEstrellas(testimonio.calificacion)}
                  </div>
                </div>
              </div>
              <p className="testimonio-descripcion">{testimonio.descripcion}</p>
              <div className="testimonio-actions">
                <button className="btn-editar" onClick={() => handleEdit(testimonio)}>
                  ✏️ Editar
                </button>
                <button className="btn-eliminar" onClick={() => setConfirmDelete(testimonio)}>
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>¿Eliminar testimonio?</h3>
            <p>¿Estás seguro de que deseas eliminar el testimonio de <strong>{confirmDelete.nombre}</strong>?</p>
            <p className="warning-text">Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button className="btn-eliminar" onClick={() => handleDelete(confirmDelete.id)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Testimonios;