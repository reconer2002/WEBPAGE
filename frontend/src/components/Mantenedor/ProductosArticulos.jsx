// frontend/src/components/Mantenedor/ProductosArticulos.jsx
import React, { useEffect, useState } from "react";
import productosService from "../../services/articulosService";
import ProductosArticulosGrid from "./ProductosArticulosGrid"; // <-- IMPORTAMOS AQUÍ
import "./ProductosArticulos.css";

const ProductosArticulos = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState("tabla"); // "tabla" o "grid"

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

  if (loading) return <p>Cargando artículos...</p>;

  return (
    <div className="productos-container">
        <h2>Gestión de artículos</h2>
      <div className="modo-toggle">
        <button onClick={() => setModo("tabla")}>Tabla</button>
        <button onClick={() => setModo("grid")}>Grid</button>
      </div>

      {modo === "tabla" && (
        <table className="tabla-articulos">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Descripción</th>
              <th>Descuento</th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((art) => (
              <tr key={art.id}>
                <td>{art.nombre}</td>
                <td>${Math.floor(art.precio)}</td>
                <td>{art.descripcion}</td>
                <td>{Math.floor(art.descuento)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modo === "grid" && (
        <ProductosArticulosGrid 
          articulos={articulos}
          setArticulos={setArticulos}
          cargarArticulos={cargarArticulos}
        />
      )}
    </div>
  );
};

export default ProductosArticulos;