// src/components/Mantenedor/PaginaColores.jsx
import React, { useState, useEffect } from 'react';
import paginaService from '../../services/paginaService';
import './PaginaColores.css';

const PaginaColores = ({ onActualizarColores }) => {
  const [colores, setColores] = useState({
    color1: '#ffffff',
    color2: '#000000',
    color3: '#f0f0f0',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchColores = async () => {
      setLoading(true);
      try {
        const data = await paginaService.getColoresPagina();
        setColores(data);
      } catch (err) {
        console.error('Error al cargar colores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchColores();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setColores((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await paginaService.updateColoresPagina(colores);

      // Notificar al App (si nos pasaron la función) para que aplique colores globalmente
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('pagina:colores:updated', { detail: colores }));
      }

      if (typeof onActualizarColores === 'function') {
        try {
          onActualizarColores(colores);
        } catch (e) {
          // no bloquear si la prop falla
          console.warn('onActualizarColores falló:', e);
        }
      }

      alert('Colores actualizados correctamente');
    } catch (err) {
      console.log("Error al actualizar colores: ", err);
      alert('Error al actualizar colores');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando colores...</p>;

  return (
    <div className="pagina-colores-container">
      <h3>Edición de colores de la página</h3>
      <div className="color-inputs">
        {Object.entries(colores).map(([key, value]) => (
          <div className="color-item" key={key}>
            <label>{key}</label>
            <input
              type="color"
              name={key}
              value={value}
              onChange={handleChange}
            />
            <input
              type="text"
              name={key}
              value={value}
              onChange={handleChange}
              placeholder="#hex o rgb()"
            />
          </div>
        ))}
      </div>
      <button className="btn" onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
};

export default PaginaColores;