// ProductosObjetosGrid.jsx
import React, { useEffect, useState } from "react";
import objetosService from "../../services/objetosService";
import variantesService from "../../services/variantesService";
import "./ProductosObjetosGrid.css";

const ProductosObjetosGrid = ({ articulo }) => {
  const [objetos, setObjetos] = useState([]);
  const [variantesArticulo, setVariantesArticulo] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({});
  const [formData, setFormData] = useState({ precio: "", existencias: 0, variantes: {} });
  const [seleccionado, setSeleccionado] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [opcionesFiltros, setOpcionesFiltros] = useState({}); // Valores únicos para filtros

  useEffect(() => {
    if (articulo?.id) cargarDatos();
  }, [articulo]);

  const cargarDatos = async () => {
    const objs = await objetosService.getObjetos(articulo.id);
    const vars = await variantesService.getVariantes(articulo.id);

    setObjetos(objs || []);
    setVariantesArticulo(vars || []);

    // Categorías
    const cats = [...new Set(vars.map(v => v.categoria))];
    setCategorias(cats);

    // Inicializar filtros
    const filtrosInicial = {};
    const opcionesInicial = {};
    cats.forEach(cat => {
      filtrosInicial[cat] = "";
      // Valores únicos para filtros
      opcionesInicial[cat] = [...new Set(vars.filter(v => v.categoria === cat).map(v => v.nombre))];
    });
    setFiltros(filtrosInicial);
    setOpcionesFiltros(opcionesInicial);
  };

  // Mapear objeto a { categoria: {id, nombre} }
  const mapVariantesObjeto = (obj) => {
    const m = {};
    (obj.variantes || []).forEach(v => {
      m[v.categoria] = { id: v.id, nombre: v.valor || v.nombre };
    });
    return m;
  };

  const objetosFiltrados = objetos.filter(obj => {
    const variantesMap = mapVariantesObjeto(obj);
    return categorias.every(cat => !filtros[cat] || (variantesMap[cat]?.nombre === filtros[cat]));
  });

  const handleFiltroChange = (categoria, value) => {
    setFiltros(prev => ({ ...prev, [categoria]: value }));
  };

  const handleClickObjeto = (obj) => {
    setModoNuevo(false);
    setSeleccionado(obj);

    const variantesMap = mapVariantesObjeto(obj);
    const formVars = {};
    categorias.forEach(cat => {
      formVars[cat] = variantesMap[cat]?.id || "";
    });

    setFormData({ precio: obj.precio, existencias: obj.existencias, variantes: formVars });
  };

  const handleClickNuevo = () => {
    setModoNuevo(true);
    setSeleccionado(null);

    const formVars = {};
    categorias.forEach(cat => formVars[cat] = "");
    setFormData({ precio: "", existencias: 0, variantes: formVars });
  };

  const handleCerrar = () => {
    setSeleccionado(null);
    setModoNuevo(false);
  };

  const handleVarianteChange = (cat, value) => {
    setFormData(prev => ({ ...prev, variantes: { ...prev.variantes, [cat]: value } }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCrear = async () => {
    const varianteIds = Object.values(formData.variantes).filter(Boolean);
    await objetosService.createObjeto(articulo.id, {
      precio: parseFloat(formData.precio),
      existencias: parseInt(formData.existencias),
      variantes: varianteIds
    });
    cargarDatos();
    handleCerrar();
  };

  const handleActualizar = async () => {
    const varianteIds = Object.values(formData.variantes).filter(Boolean);
    await objetosService.updateObjeto(seleccionado.id, {
      precio: parseFloat(formData.precio),
      existencias: parseInt(formData.existencias),
      variantes: varianteIds
    });
    cargarDatos();
    handleCerrar();
  };

  const handleEliminar = async () => {
    if (!window.confirm("¿Eliminar este objeto?")) return;
    await objetosService.deleteObjeto(seleccionado.id);
    cargarDatos();
    handleCerrar();
  };

  return (
    <div className="productos-objetos-grid-contenido">
      <h3>Objetos de {articulo.nombre}</h3>

      {/* Filtros */}
      <div className="filtros">
        {categorias.map(cat => (
          <div key={cat} className="filtro-categoria">
            <label>{cat}:</label>
            <select value={filtros[cat]} onChange={e => handleFiltroChange(cat, e.target.value)}>
              <option value="">--</option>
              {opcionesFiltros[cat]?.map(val => <option key={val} value={val}>{val}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="contenedor-principal">
        {/* Grid de objetos */}
        <div className={`grid-objetos mostrador ${seleccionado || modoNuevo ? "reducido" : "completo"}`}>
          {objetosFiltrados.map(obj => {
            const variantesMap = mapVariantesObjeto(obj);
            const nombreGrid = categorias.map(cat => variantesMap[cat]?.nombre || "-").join(" - ");
            return (
              <div key={obj.id} className="objeto-item" onClick={() => handleClickObjeto(obj)}>
                <p className="nombre">{nombreGrid}</p>
                <p>Precio: ${obj.precio}</p>
                <p>Stock: {obj.existencias}</p>
              </div>
            );
          })}

          <div className="objeto-item add-item" onClick={handleClickNuevo}>
            <p>➕ Añadir Objeto</p>
          </div>
        </div>

        {/* Panel de edición/creación */}
        {(seleccionado || modoNuevo) && (
          <div className="seleccion abierto">
            <div className="cerrar" onClick={handleCerrar}>&#x2715;</div>
            <h4>{modoNuevo ? "Nuevo Objeto" : "Editar Objeto"}</h4>
            <div className="info">
              <p>Precio:</p>
              <input type="number" name="precio" value={formData.precio} onChange={handleChange} />
              <p>Existencias:</p>
              <input type="number" name="existencias" value={formData.existencias} onChange={handleChange} />

              {categorias.map(cat => {
                const opciones = variantesArticulo.filter(v => v.categoria === cat);
                return (
                  <div key={cat}>
                    <p>{cat}:</p>
                    <select
                      value={formData.variantes[cat] || ""}
                      onChange={e => handleVarianteChange(cat, parseInt(e.target.value))}
                    >
                      <option value="">--</option>
                      {opciones.map(opt => <option key={opt.id} value={opt.id}>{opt.nombre}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="botonera-panel">
              {modoNuevo ? (
                <button onClick={handleCrear}>Añadir Objeto</button>
              ) : (
                <>
                  <button onClick={handleActualizar}>Actualizar</button>
                  <button onClick={handleEliminar} className="btn-danger">Eliminar</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductosObjetosGrid;
