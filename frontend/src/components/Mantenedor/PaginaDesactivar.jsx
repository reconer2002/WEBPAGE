import React, { useState, useEffect } from "react";
import paginaService from "../../services/paginaService";
import "./PaginaDesactivar.css";

const PaginaDesactivar = () => {
  const [estado, setEstado] = useState(false); // false = apagado, true = encendido
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch estado actual al montar
  useEffect(() => {
    const fetchEstado = async () => {
      try {
        const estadoActual = await paginaService.getEstadoPagina();
        setEstado(estadoActual);
      } catch (err) {
        console.error("Error al obtener estado de la página:", err);
      }
    };
    fetchEstado();
  }, []);

  const handleSwitchChange = () => {
    setEstado(prev => !prev);
  };

  const handleGuardar = async () => {
    setLoading(true);
    setMessage("");
    try {
      await paginaService.updateEstado(estado);
      setMessage("Estado actualizado correctamente.");
    } catch (err) {
      console.error(err);
      setMessage("Error al actualizar estado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pagina-desactivar">
      <h2>Estado de la Página</h2>
      {message && <p className="message">{message}</p>}
      <div className="switch-container">
        <label className="switch">
          <input type="checkbox" checked={estado} onChange={handleSwitchChange} />
          <span className="slider round"></span>
        </label>
        <span>{estado ? "Página Activa" : "Página Desactivada"}</span>
      </div>
      <button onClick={handleGuardar} disabled={loading}>
        {loading ? "Guardando..." : "Guardar estado"}
      </button>
    </div>
  );
};

export default PaginaDesactivar;