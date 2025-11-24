import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MaintenancePage.css';

const MaintenancePage = () => {
  const navigate = useNavigate();

  return (
    <div className="maintenance-page">
      <div className="maintenance-container">
        <div className="maintenance-icon">🔧</div>
        <h1 className="maintenance-title">Sitio en Mantenimiento</h1>
        <p className="maintenance-message">
          Estamos realizando mejoras en nuestra plataforma.
        </p>
        <p className="maintenance-submessage">
          Volveremos pronto. Disculpa las molestias.
        </p>
        <div className="maintenance-loader">
          <div className="loader-bar"></div>
          <div className="loader-bar"></div>
          <div className="loader-bar"></div>
        </div>
        
        {/* Botón para administradores */}
        <div className="maintenance-admin">
          <button 
            className="admin-access-btn"
            onClick={() => navigate('/')}
          >
            🔑 Acceso Administrativo
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
