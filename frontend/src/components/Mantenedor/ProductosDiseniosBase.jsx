// frontend/src/components/Mantenedor/ProductosDiseniosBase.jsx
import React, { useEffect, useState } from "react";
import diseniosBaseService from "../../services/diseniosBaseService";
import "./ProductosDiseniosBase.css";

const ProductosDiseniosBase = () => {
  const [diseniosBase, setDiseniosBase] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: "" });
  
  const [formData, setFormData] = useState({
    nombre: "",
    frenteFile: null,
    frentePreview: null,
    espaldaFile: null,
    espaldaPreview: null,
    izquierdaFile: null,
    izquierdaPreview: null,
    derechaFile: null,
    derechaPreview: null,
  });

  useEffect(() => {
    cargarDiseniosBase();
  }, []);

  const cargarDiseniosBase = async () => {
    setLoading(true);
    try {
      const data = await diseniosBaseService.getAll();
      setDiseniosBase(data);
    } catch (err) {
      console.error(err);
      mostrarNotificacion("Error al cargar diseños base");
    } finally {
      setLoading(false);
    }
  };

  const mostrarNotificacion = (mensaje) => {
    setNotificacion({ mostrar: true, mensaje });
    setTimeout(() => {
      setNotificacion({ mostrar: false, mensaje: "" });
    }, 3000);
  };

  const handleClickDisenio = (disenio) => {
    setModoNuevo(false);
    setSeleccionado(disenio);
    setFormData({
      nombre: disenio.nombre || "",
      frenteFile: null,
      frentePreview: disenio.frente || null,
      espaldaFile: null,
      espaldaPreview: disenio.espalda || null,
      izquierdaFile: null,
      izquierdaPreview: disenio.izquierda || null,
      derechaFile: null,
      derechaPreview: disenio.derecha || null,
    });
  };

  const handleClickNuevo = () => {
    setModoNuevo(true);
    setSeleccionado({ id: null });
    setFormData({
      nombre: "",
      frenteFile: null,
      frentePreview: null,
      espaldaFile: null,
      espaldaPreview: null,
      izquierdaFile: null,
      izquierdaPreview: null,
      derechaFile: null,
      derechaPreview: null,
    });
  };

  const handleCerrar = () => {
    setSeleccionado(null);
    setModoNuevo(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (vista, e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFormData((prev) => ({
      ...prev,
      [`${vista}File`]: file,
      [`${vista}Preview`]: file ? URL.createObjectURL(file) : prev[`${vista}Preview`],
    }));
  };

  const handleCrear = async () => {
    if (!formData.nombre.trim()) {
      mostrarNotificacion("El nombre es requerido");
      return;
    }

    try {
      const data = {
        nombre: formData.nombre,
        frente: formData.frenteFile,
        espalda: formData.espaldaFile,
        izquierda: formData.izquierdaFile,
        derecha: formData.derechaFile,
      };
      await diseniosBaseService.create(data);
      mostrarNotificacion("Diseño base creado correctamente");
      setSeleccionado(null);
      setModoNuevo(false);
      cargarDiseniosBase();
    } catch (err) {
      console.error(err);
      mostrarNotificacion("Error al crear diseño base");
    }
  };

  const handleActualizar = async () => {
    if (!seleccionado?.id) return;
    if (!formData.nombre.trim()) {
      mostrarNotificacion("El nombre es requerido");
      return;
    }

    try {
      const data = {
        nombre: formData.nombre,
      };
      
      // Solo incluir archivos si se seleccionaron nuevos
      if (formData.frenteFile) data.frente = formData.frenteFile;
      if (formData.espaldaFile) data.espalda = formData.espaldaFile;
      if (formData.izquierdaFile) data.izquierda = formData.izquierdaFile;
      if (formData.derechaFile) data.derecha = formData.derechaFile;

      await diseniosBaseService.update(seleccionado.id, data);
      mostrarNotificacion("Diseño base actualizado correctamente");
      setSeleccionado(null);
      cargarDiseniosBase();
    } catch (err) {
      console.error(err);
      mostrarNotificacion("Error al actualizar diseño base");
    }
  };

  const handleEliminar = async () => {
    if (!seleccionado?.id) return;
    if (window.confirm("¿Seguro que deseas eliminar este diseño base? Esto puede afectar a los objetos que lo usan.")) {
      try {
        await diseniosBaseService.delete(seleccionado.id);
        mostrarNotificacion("Diseño base eliminado correctamente");
        setSeleccionado(null);
        cargarDiseniosBase();
      } catch (err) {
        console.error(err);
        mostrarNotificacion("Error al eliminar diseño base");
      }
    }
  };

  if (loading) return <p>Cargando diseños base...</p>;

  return (
    <div className="productos-disenios-base-root">
      {/* Notificación popup */}
      {notificacion.mostrar && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '5px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 9999,
          animation: 'slideDown 0.3s ease-out'
        }}>
          {notificacion.mensaje}
        </div>
      )}

      <h2>Gestión de Diseños Base</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Los diseños base definen las imágenes de las vistas (frente, espalda, izquierda, derecha) para los objetos.
      </p>

      <section className="grid-contenido">
        {/* Grid de diseños base */}
        <div className={`mostrador ${seleccionado || modoNuevo ? "reducido" : "completo"}`}>
          {diseniosBase.length === 0 && <p>No hay diseños base</p>}

          <div className="grid-disenios-base">
            {diseniosBase.map((disenio) => (
              <div
                key={disenio.id}
                className="disenio-item"
                onClick={() => handleClickDisenio(disenio)}
                style={{
                  border:
                    seleccionado && seleccionado.id === disenio.id
                      ? "2px solid #2196F3"
                      : "1px solid #ddd",
                }}
              >
                <div className="contenedor-preview">
                  {disenio.frente && <img src={disenio.frente} alt={`${disenio.nombre} - frente`} />}
                  {!disenio.frente && <div className="sin-imagen">Sin imagen</div>}
                </div>
                <p className="nombre-disenio">{disenio.nombre}</p>
                <div className="info-vistas">
                  {disenio.frente && <span className="badge">F</span>}
                  {disenio.espalda && <span className="badge">E</span>}
                  {disenio.izquierda && <span className="badge">I</span>}
                  {disenio.derecha && <span className="badge">D</span>}
                </div>
              </div>
            ))}

            <div className="disenio-item add-item" onClick={handleClickNuevo}>
              <p>➕ Añadir Diseño Base</p>
            </div>
          </div>
        </div>

        {/* Panel de edición/creación */}
        {(seleccionado || modoNuevo) && (
          <div className="seleccion abierto">
            <div className="cerrar" onClick={handleCerrar}>&#x2715;</div>
            <h4>{modoNuevo ? "Nuevo Diseño Base" : "Editar Diseño Base"}</h4>
            
            <div className="info">
              <label>
                <strong>Nombre:</strong>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Polera Amarilla"
                />
              </label>

              <div className="vistas-container">
                {/* Vista Frente */}
                <div className="vista-upload">
                  <strong>Frente:</strong>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange("frente", e)}
                  />
                  {formData.frentePreview && (
                    <div className="preview-imagen">
                      <img src={formData.frentePreview} alt="Preview frente" />
                    </div>
                  )}
                </div>

                {/* Vista Espalda */}
                <div className="vista-upload">
                  <strong>Espalda:</strong>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange("espalda", e)}
                  />
                  {formData.espaldaPreview && (
                    <div className="preview-imagen">
                      <img src={formData.espaldaPreview} alt="Preview espalda" />
                    </div>
                  )}
                </div>

                {/* Vista Izquierda */}
                <div className="vista-upload">
                  <strong>Izquierda:</strong>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange("izquierda", e)}
                  />
                  {formData.izquierdaPreview && (
                    <div className="preview-imagen">
                      <img src={formData.izquierdaPreview} alt="Preview izquierda" />
                    </div>
                  )}
                </div>

                {/* Vista Derecha */}
                <div className="vista-upload">
                  <strong>Derecha:</strong>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange("derecha", e)}
                  />
                  {formData.derechaPreview && (
                    <div className="preview-imagen">
                      <img src={formData.derechaPreview} alt="Preview derecha" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="botonera-panel">
              {modoNuevo ? (
                <button className="btn-primary" onClick={handleCrear}>Crear Diseño Base</button>
              ) : (
                <>
                  <button className="btn-primary" onClick={handleActualizar}>Actualizar</button>
                  <button className="btn-danger" onClick={handleEliminar}>Eliminar</button>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductosDiseniosBase;
