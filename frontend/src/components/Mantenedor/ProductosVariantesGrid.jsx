import React, { useEffect, useState } from "react";
import variantesService from "../../services/variantesService";
import "./ProductosVariantesGrid.css";

const ProductosVariantesGrid = ({ articulo }) => {
  const [variantes, setVariantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    // Imágenes para cada vista
    imagenFrenteFile: null,
    imagenIzquierdaFile: null,
    imagenDerechaFile: null,
    imagenDetrasFile: null,
    // Previews
    imagenFrentePreview: null,
    imagenIzquierdaPreview: null,
    imagenDerechaPreview: null,
    imagenDetrasPreview: null,
  });

  useEffect(() => {
    if (!articulo?.id) return;
    cargarVariantes();
    setSeleccionado(null);
    setModoNuevo(false);
  }, [articulo]);

  const cargarVariantes = async () => {
    setLoading(true);
    try {
      const data = await variantesService.getVariantes(articulo.id);
      setVariantes(data); // ya vienen normalizadas
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClickVariante = (v) => {
    setModoNuevo(false);
    setSeleccionado(v);
    setFormData({
      nombre: v.nombre,
      categoria: v.categoria,
      // No cambiamos las imágenes hasta que el usuario suba nuevas
      imagenFrenteFile: null,
      imagenIzquierdaFile: null,
      imagenDerechaFile: null,
      imagenDetrasFile: null,
      // Mostramos las actuales
      imagenFrentePreview: v.imagen_frente || v.imagen || null,
      imagenIzquierdaPreview: v.imagen_izquierda || v.imagen || null,
      imagenDerechaPreview: v.imagen_derecha || v.imagen || null,
      imagenDetrasPreview: v.imagen_detras || v.imagen || null,
    });
  };

  const handleClickNuevo = (categoria) => {
    setModoNuevo(true);
    setSeleccionado({ id: null });
    setFormData({
      nombre: "",
      categoria: categoria || "",
      imagenFrenteFile: null,
      imagenIzquierdaFile: null,
      imagenDerechaFile: null,
      imagenDetrasFile: null,
      imagenFrentePreview: null,
      imagenIzquierdaPreview: null,
      imagenDerechaPreview: null,
      imagenDetrasPreview: null,
    });
  };

  const handleCerrar = () => {
    setSeleccionado(null);
    setModoNuevo(false);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Mapear los nombres de los inputs a las propiedades correspondientes
    const viewMapping = {
      'imagenFrente': { fileKey: 'imagenFrenteFile', previewKey: 'imagenFrentePreview' },
      'imagenIzquierda': { fileKey: 'imagenIzquierdaFile', previewKey: 'imagenIzquierdaPreview' },
      'imagenDerecha': { fileKey: 'imagenDerechaFile', previewKey: 'imagenDerechaPreview' },
      'imagenDetras': { fileKey: 'imagenDetrasFile', previewKey: 'imagenDetrasPreview' }
    };

    const mapping = viewMapping[name];
    if (mapping) {
      if (files && files.length > 0) {
        setFormData((prev) => ({
          ...prev,
          [mapping.fileKey]: files[0],
          [mapping.previewKey]: URL.createObjectURL(files[0]),
        }));
      } else {
        setFormData((prev) => ({ 
          ...prev, 
          [mapping.fileKey]: null, 
          [mapping.previewKey]: null 
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCrear = async () => {
    try {
      await variantesService.createVariante(articulo.id, {
        nombre: formData.nombre,
        categoria: formData.categoria,
        imagenFrenteFile: formData.imagenFrenteFile,
        imagenIzquierdaFile: formData.imagenIzquierdaFile,
        imagenDerechaFile: formData.imagenDerechaFile,
        imagenDetrasFile: formData.imagenDetrasFile,
      });
      cargarVariantes();
      setSeleccionado(null);
      setModoNuevo(false);
    } catch (err) {
      console.error(err);
      alert("Error al crear variante");
    }
  };

  const handleActualizar = async () => {
    try {
      await variantesService.updateVariante(seleccionado.id, {
        nombre: formData.nombre,
        categoria: formData.categoria,
        imagenFrenteFile: formData.imagenFrenteFile,
        imagenIzquierdaFile: formData.imagenIzquierdaFile,
        imagenDerechaFile: formData.imagenDerechaFile,
        imagenDetrasFile: formData.imagenDetrasFile,
      });
      cargarVariantes();
      setSeleccionado(null);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar variante");
    }
  };

  const handleEliminar = async () => {
    if (!seleccionado?.id) return;
    if (!window.confirm("¿Eliminar esta variante?")) return;
    try {
      await variantesService.deleteVariante(seleccionado.id);
      cargarVariantes();
      setSeleccionado(null);
    } catch (err) {
      console.error(err);
      alert("Error al eliminar variante");
    }
  };

  const categorias = [...new Set(variantes.map((v) => v.categoria))];

  const renderVariante = (v) => (
    <div className={`contenedor-foto ${!v.imagen ? "sin-imagen" : ""}`}>
      {v.imagen ? <img src={v.imagen} alt={v.nombre} /> : <span>{v.nombre}</span>}
      {v.imagen && <p className="descripcion">{v.nombre}</p>}
    </div>
  );

  return (
    <div className={`grid-contenido`}>
      <div className={`mostrador ${seleccionado || modoNuevo ? "reducido" : "completo"}`}>
        <h3>Variantes de {articulo.nombre}</h3>
        {loading && <p>Cargando variantes...</p>}

        {categorias.map((cat) => (
          <div key={cat} className="categoria">
            <h4>{cat}</h4>
            <div className="grid-variantes">
              {variantes
                .filter((v) => v.categoria === cat)
                .map((v) => (
                  <div
                    key={v.id}
                    className={`variante-item ${seleccionado?.id === v.id ? "seleccionado" : ""}`}
                    onClick={() => handleClickVariante(v)}
                  >
                    {renderVariante(v)}
                  </div>
                ))}
              <div className="variante-item add-item" onClick={() => handleClickNuevo(cat)}>
                <p>➕ Añadir Variante</p>
              </div>
            </div>
          </div>
        ))}

        {/* Mostrar botón para añadir primera variante si no hay variantes */}
        {categorias.length === 0 && (
          <div className="categoria">
            <h4>Sin variantes</h4>
            <div className="grid-variantes">
              <div className="variante-item add-item" onClick={() => handleClickNuevo("")}>
                <p>➕ Añadir Primera Variante</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {(seleccionado || modoNuevo) && (
        <div className={`seleccion abierto`}>
          <div className="cerrar" onClick={handleCerrar}>
            &#x2715;
          </div>
          <h4>{modoNuevo ? "Nueva Variante" : "Editar Variante"}</h4>
          <div className="info">
            {/* Mostrar preview de la imagen frontal como principal */}
            {formData.imagenFrentePreview && (
              <div className="imagen-contenedor">
                <img src={formData.imagenFrentePreview} alt={formData.nombre} />
                <span
                  className="icono-eliminar-imagen"
                  onClick={() => setFormData((prev) => ({ 
                    ...prev, 
                    imagenFrenteFile: null, 
                    imagenFrentePreview: null 
                  }))}
                >
                  ✕
                </span>
              </div>
            )}

            <p>Nombre:</p>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} />
            <p>Categoría:</p>
            <input type="text" name="categoria" value={formData.categoria} onChange={handleChange} />
            
            {/* Sección de imágenes por vistas */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>Imágenes por Vista</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '500' }}>👤 Vista Frontal:</p>
                  <input type="file" name="imagenFrente" accept="image/*" onChange={handleChange} />
                  {formData.imagenFrentePreview && (
                    <img src={formData.imagenFrentePreview} alt="Frente" style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '4px', borderRadius: '4px' }} />
                  )}
                </div>
                
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '500' }}>🔄 Vista Trasera:</p>
                  <input type="file" name="imagenDetras" accept="image/*" onChange={handleChange} />
                  {formData.imagenDetrasPreview && (
                    <img src={formData.imagenDetrasPreview} alt="Detrás" style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '4px', borderRadius: '4px' }} />
                  )}
                </div>
                
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '500' }}>⬅️ Vista Izquierda:</p>
                  <input type="file" name="imagenIzquierda" accept="image/*" onChange={handleChange} />
                  {formData.imagenIzquierdaPreview && (
                    <img src={formData.imagenIzquierdaPreview} alt="Izquierda" style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '4px', borderRadius: '4px' }} />
                  )}
                </div>
                
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '500' }}>➡️ Vista Derecha:</p>
                  <input type="file" name="imagenDerecha" accept="image/*" onChange={handleChange} />
                  {formData.imagenDerechaPreview && (
                    <img src={formData.imagenDerechaPreview} alt="Derecha" style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '4px', borderRadius: '4px' }} />
                  )}
                </div>
              </div>
              
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                Nota: Si no subes todas las vistas, se heredarán del artículo base
              </p>
            </div>
          </div>

          <div className="botonera-panel">
            {modoNuevo ? (
              <button onClick={handleCrear}>Añadir Variante</button>
            ) : (
              <>
                <button onClick={handleActualizar}>Actualizar</button>
                <button onClick={handleEliminar} className="btn-danger">
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosVariantesGrid;

