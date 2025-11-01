// frontend/src/components/Mantenedor/ProductosArticulosGrid.jsx
import React, { useState } from "react";
import productosService from "../../services/articulosService";
import ProductosVariantesGrid from "./ProductosVariantesGrid";
import ProductosObjetosGrid from "./ProductosObjetosGrid";
import "./ProductosArticulosGrid.css";

const ProductosArticulosGrid = ({ articulos, setArticulos, cargarArticulos }) => {
  const [seleccionado, setSeleccionado] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: "" });

  // Usamos solo un archivo/preview para la imagen principal
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    descuento: 0,
    ranking: 0,
    // Un solo archivo
    fotoFile: null, 
    // Un solo preview
    fotoPreview: null,
  });

  const mostrarNotificacion = (mensaje) => {
    setNotificacion({ mostrar: true, mensaje });
    setTimeout(() => {
      setNotificacion({ mostrar: false, mensaje: "" });
    }, 3000);
  };

  const handleClickArticulo = (art) => {
    setModoNuevo(false);
    setSeleccionado(art);
    setFormData({
      nombre: art.nombre || "",
      precio: art.precio ? Math.floor(art.precio) : "",
      descripcion: art.descripcion || "",
      descuento: art.descuento ? Math.floor(art.descuento) : 0,
      ranking: art.ranking || 0,
      // Solo el archivo y preview principal
      fotoFile: null, 
      fotoPreview: art.foto || null,
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
      fotoFile: null,
      fotoPreview: null,
    });
  };

  const handleCerrar = () => {
    setSeleccionado(null);
    setModoNuevo(false);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Manejo especial para el input file principal
    if (name === "foto") { // <-- Cambiado a un solo input 'foto'
      const file = files && files[0] ? files[0] : null;
      setFormData((prev) => ({
        ...prev,
        fotoFile: file,
        fotoPreview: file ? URL.createObjectURL(file) : prev.fotoPreview,
      }));
      return;
    }
    
    // Manejo especial para precio y descuento (sin decimales)
    if (name === "precio" || name === "descuento") {
      const numValue = value === "" ? "" : Math.floor(Number(value));
      setFormData((prev) => ({ ...prev, [name]: numValue }));
      return;
    }
    
    // Manejo normal de inputs de texto/número
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleActualizar = async () => {
    if (!seleccionado?.id) return;
    try {
      // Actualizar en el backend
      await productosService.updateArticulo(seleccionado.id, formData);
      
      // Actualizar el estado local de artículos para reflejar los cambios inmediatamente
      setArticulos((prevArticulos) =>
        prevArticulos.map((art) => {
          if (art.id === seleccionado.id) {
            // Mantener la foto original si no se cambió
            return {
              ...art,
              nombre: formData.nombre,
              precio: formData.precio,
              descripcion: formData.descripcion,
              descuento: formData.descuento,
              ranking: formData.ranking,
              foto: formData.fotoFile ? formData.fotoPreview : art.foto
            };
          }
          return art;
        })
      );
      
      mostrarNotificacion("Artículo actualizado correctamente");
      setSeleccionado(null);
    } catch (err) {
      console.error(err);
      mostrarNotificacion("Error al actualizar artículo");
    }
  };

  const handleCrear = async () => {
    try {
      await productosService.createArticulo(formData);
      mostrarNotificacion("Artículo creado correctamente");
      setSeleccionado(null);
      setModoNuevo(false);
      cargarArticulos();
    } catch (err) {
      console.error(err);
      mostrarNotificacion("Error al crear artículo");
    }
  };

  const handleEliminar = async () => {
    if (!seleccionado?.id) return;
    if (window.confirm("¿Seguro que deseas eliminar este artículo?")) {
      try {
        await productosService.deleteArticulo(seleccionado.id);
        mostrarNotificacion("Artículo eliminado correctamente");
        setSeleccionado(null);
        cargarArticulos();
      } catch (err) {
        console.error(err);
        mostrarNotificacion("Error al eliminar artículo");
      }
    }
  };

  return (
    <div className="productos-grid-root">
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
                      <span className="precio">${Math.floor(art.precio)}</span>
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
                {/* Mostrar preview de la imagen principal */}
                {formData.fotoPreview && (
                  <img src={formData.fotoPreview} alt={formData.nombre} />
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
                  onWheel={(e) => e.target.blur()}
                  placeholder="Precio"
                  step="1"
                  min="0"
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
                  onWheel={(e) => e.target.blur()}
                  placeholder="Descuento"
                  step="1"
                  min="0"
                  max="100"
                />

                <p>Ranking:</p>
                <input
                  type="number"
                  name="ranking"
                  value={formData.ranking}
                  onChange={handleChange}
                  onWheel={(e) => e.target.blur()}
                  placeholder="Ranking"
                />

                <p>Imagen Principal:</p> {/* <-- Input principal restaurado */}
                <input type="file" name="foto" accept="image/*" onChange={handleChange} />
                
                {/* *** SE ELIMINA LA SECCIÓN DE VISTAS (div con estilos inline) ***
                */}
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
    </div>
  );
};

export default ProductosArticulosGrid;