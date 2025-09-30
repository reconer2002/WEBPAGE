import React, { useEffect, useState } from "react";
import objetosService from "../../services/objetosMockService";
import variantesService from "../../services/variantesMockService";
import "./ProductosObjetosGrid.css";

const ProductosObjetosGrid = ({ articulo }) => {
  const [objetos, setObjetos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({});
  const [variantesArticulo, setVariantesArticulo] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [formData, setFormData] = useState({ precio: "", existencias: 0, variantes: {} });

  useEffect(() => {
    if (!articulo?.id) return;
    cargarDatos();
  }, [articulo]);

  const cargarDatos = async () => {
    try {
      const objData = await objetosService.getObjetos(articulo.id);
      setObjetos(objData);

      const vars = await variantesService.getVariantes(articulo.id);
      setVariantesArticulo(vars);

      const cats = [...new Set(vars.map(v => v.categoria))];
      setCategorias(cats);

      const filtrosIniciales = {};
      cats.forEach(cat => (filtrosIniciales[cat] = ""));
      setFiltros(filtrosIniciales);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFiltroChange = (categoria, value) => {
    setFiltros(prev => ({ ...prev, [categoria]: value }));
  };

  // Mapear IDs de variantes a {categoria: valor}
  const objetosConValores = objetos.map(obj => {
    const objVars = {};
    obj.variantes.forEach(idVar => {
      const varData = variantesArticulo.find(v => v.id === idVar);
      if (varData) objVars[varData.categoria] = varData.nombre;
    });
    return { ...obj, variantesMap: objVars };
  });

  const objetosFiltrados = objetosConValores.filter(obj =>
    categorias.every(cat => !filtros[cat] || obj.variantesMap[cat] === filtros[cat])
  );

  const handleClickObjeto = (obj) => {
    setModoNuevo(false);
    setSeleccionado(obj);
    const variantesMap = {};
    obj.variantes.forEach(idVar => {
      const v = variantesArticulo.find(v => v.id === idVar);
      if (v) variantesMap[v.categoria] = v.id;
    });
    setFormData({ precio: obj.precio, existencias: obj.existencias, variantes: variantesMap });
  };

  const handleClickNuevo = () => {
    setModoNuevo(true);
    setSeleccionado({ id: null });
    const variantesMap = {};
    categorias.forEach(cat => variantesMap[cat] = "");
    setFormData({ precio: "", existencias: 0, variantes: variantesMap });
  };

  const handleCerrar = () => {
    setSeleccionado(null);
    setModoNuevo(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVarianteChange = (categoria, value) => {
    setFormData(prev => ({ ...prev, variantes: { ...prev.variantes, [categoria]: value } }));
  };

  const handleCrear = async () => {
    try {
      const varianteIds = Object.values(formData.variantes).filter(Boolean);
      await objetosService.createObjeto(articulo.id, {
        precio: parseFloat(formData.precio),
        existencias: parseInt(formData.existencias),
        variantes: varianteIds
      });
      cargarDatos();
      handleCerrar();
    } catch (err) {
      console.error(err);
      alert("Error al crear objeto");
    }
  };

  const handleActualizar = async () => {
    try {
      const varianteIds = Object.values(formData.variantes).filter(Boolean);
      await objetosService.updateObjeto(seleccionado.id, {
        precio: parseFloat(formData.precio),
        existencias: parseInt(formData.existencias),
        variantes: varianteIds
      });
      cargarDatos();
      handleCerrar();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar objeto");
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm("¿Eliminar este objeto?")) return;
    try {
      await objetosService.deleteObjeto(seleccionado.id);
      cargarDatos();
      handleCerrar();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar objeto");
    }
  };

  return (
    <div className="productos-objetos-grid-contenido">
      <h3>Objetos de {articulo.nombre}</h3>

      <div className="filtros">
        {categorias.map(cat => {
          const valoresUnicos = [...new Set(objetosConValores.map(obj => obj.variantesMap[cat]).filter(Boolean))];
          return (
            <div key={cat} className="filtro-categoria">
              <label>{cat}:</label>
              <select value={filtros[cat]} onChange={e => handleFiltroChange(cat, e.target.value)}>
                <option value="">--</option>
                {valoresUnicos.map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="contenedor-principal">
        <div className={`grid-objetos mostrador ${seleccionado || modoNuevo ? "reducido" : "completo"}`}>
          {objetosFiltrados.map(obj => (
            <div key={obj.id} className="objeto-item" onClick={() => handleClickObjeto(obj)}>
              <p className="nombre">({categorias.map(cat => obj.variantesMap[cat] || "-").join("-")})</p>
              <p>Precio: ${obj.precio}</p>
              <p>Stock: {obj.existencias}</p>
            </div>
          ))}
          <div className="objeto-item add-item" onClick={handleClickNuevo}>
            <p>➕ Añadir Objeto</p>
          </div>
        </div>

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
                    <select value={formData.variantes[cat] || ""} onChange={e => handleVarianteChange(cat, parseInt(e.target.value))}>
                      <option value="">--</option>
                      {opciones.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                      ))}
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
