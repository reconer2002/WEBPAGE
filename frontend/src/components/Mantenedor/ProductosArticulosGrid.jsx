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

  // Usamos fotoFile (File real) y fotoPreview (string para <img/>)
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    descuento: 0,
    ranking: 0,
    fotoFile: null,
    fotoPreview: null,
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
      fotoFile: null,               // no cambiamos la imagen hasta que el usuario suba una nueva
      fotoPreview: art.foto || null // mostramos la actual
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
    const { name, value, files, type } = e.target;

    // Manejo especial para el input file
    if (type === "file") {
      const file = files && files[0] ? files[0] : null;
      setFormData((prev) => ({
        ...prev,
        fotoFile: file,
        fotoPreview: file ? URL.createObjectURL(file) : prev.fotoPreview,
      }));
      return;
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

                <p>Imagen:</p>
                <input type="file" name="foto" accept="image/*" onChange={handleChange} />
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
