// frontend/src/components/Mantenedor/ProductosArticulosGrid.jsx
import React, { useEffect, useState } from "react";
import productosService from "../../services/articulosService";
import ProductosVariantesGrid from "./ProductosVariantesGrid";
import ProductosObjetosGrid from "./ProductosObjetosGrid";
import "./ProductosArticulosGrid.css";

const ProductosArticulosGrid = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);

  // Usamos archivos y previews para las 4 vistas
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    descuento: 0,
    ranking: 0,
    // Archivos para cada vista
    fotoFrenteFile: null,
    fotoIzquierdaFile: null,
    fotoDerechaFile: null,
    fotoDetrasFile: null,
    // Previews para mostrar en la interfaz
    fotoFrentePreview: null,
    fotoIzquierdaPreview: null,
    fotoDerechaPreview: null,
    fotoDetrasPreview: null,
  });

  useEffect(() => {
    cargarArticulos();
  }, []);

  const cargarArticulos = async () => {
    setLoading(true);
    try {
      const data = await productosService.getArticulos();
      setArticulos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClickArticulo = (art) => {
    setModoNuevo(false);
    setSeleccionado(art);
    setFormData({
      nombre: art.nombre || "",
      precio: art.precio ?? "",
      descripcion: art.descripcion || "",
      descuento: art.descuento || 0,
      ranking: art.ranking || 0,
      // No cambiamos las imágenes hasta que el usuario suba nuevas
      fotoFrenteFile: null,
      fotoIzquierdaFile: null,
      fotoDerechaFile: null,
      fotoDetrasFile: null,
      // Mostramos las actuales
      fotoFrentePreview: art.foto_frente || art.foto || null,
      fotoIzquierdaPreview: art.foto_izquierda || art.foto || null,
      fotoDerechaPreview: art.foto_derecha || art.foto || null,
      fotoDetrasPreview: art.foto_detras || art.foto || null
    });
  };

  const handleClickNuevo = () => {
    setModoNuevo(true);
    setSeleccionado({ id: null });
    setFormData({
      nombre: "",
      precio: "",
      descripcion: "",
      descuento: 0,
      ranking: 0,
      fotoFrenteFile: null,
      fotoIzquierdaFile: null,
      fotoDerechaFile: null,
      fotoDetrasFile: null,
      fotoFrentePreview: null,
      fotoIzquierdaPreview: null,
      fotoDerechaPreview: null,
      fotoDetrasPreview: null,
    });
  };

  const handleCerrar = () => {
    setSeleccionado(null);
    setModoNuevo(false);
  };

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    // Manejo especial para los inputs de archivo de vistas
    if (type === "file") {
      const file = files && files[0] ? files[0] : null;
      
      // Mapear el nombre del input a las propiedades correspondientes
      const viewMapping = {
        'fotoFrente': { fileKey: 'fotoFrenteFile', previewKey: 'fotoFrentePreview' },
        'fotoIzquierda': { fileKey: 'fotoIzquierdaFile', previewKey: 'fotoIzquierdaPreview' },
        'fotoDerecha': { fileKey: 'fotoDerechaFile', previewKey: 'fotoDerechaPreview' },
        'fotoDetras': { fileKey: 'fotoDetrasFile', previewKey: 'fotoDetrasPreview' }
      };

      const mapping = viewMapping[name];
      if (mapping) {
        setFormData((prev) => ({
          ...prev,
          [mapping.fileKey]: file,
          [mapping.previewKey]: file ? URL.createObjectURL(file) : prev[mapping.previewKey],
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleActualizar = async () => {
    if (!seleccionado?.id) return;
    try {
      await productosService.updateArticulo(seleccionado.id, formData);
      alert("Artículo actualizado");
      setSeleccionado(null);
      cargarArticulos();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar artículo");
    }
  };

  const handleCrear = async () => {
    try {
      await productosService.createArticulo(formData);
      alert("Artículo creado");
      setSeleccionado(null);
      setModoNuevo(false);
      cargarArticulos();
    } catch (err) {
      console.error(err);
      alert("Error al crear artículo");
    }
  };

  const handleEliminar = async () => {
    if (!seleccionado?.id) return;
    if (window.confirm("¿Seguro que deseas eliminar este artículo?")) {
      try {
        await productosService.deleteArticulo(seleccionado.id);
        alert("Artículo eliminado");
        setSeleccionado(null);
        cargarArticulos();
      } catch (err) {
        console.error(err);
        alert("Error al eliminar artículo");
      }
    }
  };

  if (loading) return <p>Cargando artículos...</p>;

  return (
    <>
      <section className="grid-contenido">
        {/* Grid de artículos */}
        <div className={`mostrador ${seleccionado ? "reducido" : "completo"}`}>
          {articulos.length === 0 && <p>No hay artículos</p>}

          {Array.from({ length: Math.ceil((articulos.length + 1) / 5) }).map(
            (_, rowIndex) => (
              <div key={rowIndex} className="fila">
                {articulos
                  .slice(rowIndex * 5, rowIndex * 5 + 5)
                  .map((art) => (
                    <div
                      key={art.id}
                      className="item"
                      onClick={() => handleClickArticulo(art)}
                      aria-role="button"
                      style={{
                        border:
                          seleccionado && seleccionado.id === art.id
                            ? "2px solid red"
                            : "none",
                      }}
                    >
                      <div className="contenedor-foto">
                        {art.foto && <img src={art.foto} alt={art.nombre} />}
                      </div>
                      <p className="descripcion">{art.nombre}</p>
                      <span className="precio">${art.precio}</span>
                    </div>
                  ))}

                {rowIndex === Math.floor(articulos.length / 5) && (
                  <div
                    className="item add-item"
                    onClick={handleClickNuevo}
                    aria-role="button"
                  >
                    <div className="contenedor-foto">
                      <img src="/img/add.png" alt="Añadir nuevo" />
                    </div>
                    <p className="descripcion">Añadir Artículo</p>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Panel lateral */}
        <div className={`seleccion ${seleccionado ? "abierto" : "cerrado"}`}>
          {seleccionado && (
            <div className="contenido">
              <div className="cerrar" onClick={handleCerrar}>
                &#x2715;
              </div>
              <div className="info">
                {/* Mostrar preview de la imagen frontal como principal */}
                {formData.fotoFrentePreview && (
                  <img src={formData.fotoFrentePreview} alt={formData.nombre} />
                )}

                <p>Nombre:</p>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre"
                />

                <p>Precio:</p>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  placeholder="Precio"
                />

                <p>Descripción:</p>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción"
                />

                <p>% de descuento:</p>
                <input
                  type="number"
                  name="descuento"
                  value={formData.descuento}
                  onChange={handleChange}
                  placeholder="Descuento"
                />

                <p>Ranking:</p>
                <input
                  type="number"
                  name="ranking"
                  value={formData.ranking}
                  onChange={handleChange}
                  placeholder="Ranking"
                />

                {/* Sección de imágenes por vistas */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>Imágenes por Vista</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '500' }}>👤 Vista Frontal:</p>
                      <input type="file" name="fotoFrente" accept="image/*" onChange={handleChange} />
                      {formData.fotoFrentePreview && (
                        <img src={formData.fotoFrentePreview} alt="Frente" style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '4px', borderRadius: '4px' }} />
                      )}
                    </div>
                    
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '500' }}>🔄 Vista Trasera:</p>
                      <input type="file" name="fotoDetras" accept="image/*" onChange={handleChange} />
                      {formData.fotoDetrasPreview && (
                        <img src={formData.fotoDetrasPreview} alt="Detrás" style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '4px', borderRadius: '4px' }} />
                      )}
                    </div>
                    
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '500' }}>⬅️ Vista Izquierda:</p>
                      <input type="file" name="fotoIzquierda" accept="image/*" onChange={handleChange} />
                      {formData.fotoIzquierdaPreview && (
                        <img src={formData.fotoIzquierdaPreview} alt="Izquierda" style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '4px', borderRadius: '4px' }} />
                      )}
                    </div>
                    
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '500' }}>➡️ Vista Derecha:</p>
                      <input type="file" name="fotoDerecha" accept="image/*" onChange={handleChange} />
                      {formData.fotoDerechaPreview && (
                        <img src={formData.fotoDerechaPreview} alt="Derecha" style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '4px', borderRadius: '4px' }} />
                      )}
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                    Nota: Si no subes todas las vistas, se usará la imagen frontal como fallback
                  </p>
                </div>
              </div>

              <div className="botonera-panel">
                {modoNuevo ? (
                  <button onClick={handleCrear}>Añadir Artículo</button>
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
      </section>

      {/* Grids dependientes */}
      {!modoNuevo && seleccionado?.id && (
        <>
          <ProductosVariantesGrid articulo={seleccionado} />
          <ProductosObjetosGrid articulo={seleccionado} />
        </>
      )}
    </>
  );
};

export default ProductosArticulosGrid;
