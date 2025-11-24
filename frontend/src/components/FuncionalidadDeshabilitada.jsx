import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FuncionalidadDeshabilitada.css';

const FuncionalidadDeshabilitada = ({ featureName = 'Esta funcionalidad' }) => {
  const navigate = useNavigate();

  return (
    <div className="funcionalidad-deshabilitada-container">
      <div className="funcionalidad-deshabilitada-content">
        <div className="funcionalidad-deshabilitada-icon">🚧</div>
        <h2>Funcionalidad Temporalmente Deshabilitada</h2>
        <p>{featureName} no está disponible en este momento.</p>
        <p className="funcionalidad-deshabilitada-subtitle">
          Estamos trabajando para mejorar tu experiencia. Por favor, vuelve más tarde.
        </p>
        <button 
          className="funcionalidad-deshabilitada-button"
          onClick={() => navigate('/')}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default FuncionalidadDeshabilitada;
