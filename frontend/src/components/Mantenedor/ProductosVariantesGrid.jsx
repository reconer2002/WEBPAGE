import React, { useEffect, useState } from "react";
import variantesService from "../../services/variantesMockService";
import "./ProductosVariantesGrid.css";

const ProductosVariantesGrid = ({ articulo }) => {
  const [variantes, setVariantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    imagen: null,
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
      setVariantes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClickVariante = (v) => {
    setModoNuevo(false);
    setSeleccionado(v);
    setFormData({ ...v });
  };

  const handleClickNuevo = (categoria) => {
    setModoNuevo(true);
    setSeleccionado({ id: null });
    setFormData({ nombre: "", categoria: categoria || "", imagen: null });
  };

  const handleCerrar = () => {
    setSeleccionado(null);
    setModoNuevo(false);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "imagen") {
      if (files && files.length > 0) {
        setFormData((prev) => ({
          ...prev,
          imagen: URL.createObjectURL(files[0]),
        }));
      } else {
        setFormData((prev) => ({ ...prev, imagen: null }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleActualizar = async () => {
    try {
      await variantesService.updateVariante(
        articulo.id,
        seleccionado.id,
        formData
      );
      cargarVariantes();
      setSeleccionado(null);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar variante");
    }
  };

  const handleCrear = async () => {
    try {
      await variantesService.createVariante(articulo.id, formData);
      cargarVariantes();
      setSeleccionado(null);
      setModoNuevo(false);
    } catch (err) {
      console.error(err);
      alert("Error al crear variante");
    }
  };

  const handleEliminar = async () => {
    if (!seleccionado?.id) return;
    if (!window.confirm("¿Eliminar esta variante?")) return;
    try {
      await variantesService.deleteVariante(articulo.id, seleccionado.id);
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

        {variantes.length === 0 && (
          <div className="grid-variantes">
            <div className="variante-item add-item" onClick={() => handleClickNuevo("")}>
              <p>➕ Añadir Variante</p>
            </div>
          </div>
        )}

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
      </div>

      {(seleccionado || modoNuevo) && (
        <div className={`seleccion abierto`}>
          <div className="cerrar" onClick={handleCerrar}>
            &#x2715;
          </div>
          <h4>{modoNuevo ? "Nueva Variante" : "Editar Variante"}</h4>
          <div className="info">
            {formData.imagen && (
              <div className="imagen-contenedor">
                <img src={formData.imagen} alt={formData.nombre} />
                <span
                  className="icono-eliminar-imagen"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, imagen: null }))
                  }
                >
                  ✕
                </span>
              </div>
            )}

            <p>Nombre:</p>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
            />
            <p>Categoría:</p>
            <input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
            />
            <p>Imagen:</p>
            <input type="file" name="imagen" onChange={handleChange} />
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