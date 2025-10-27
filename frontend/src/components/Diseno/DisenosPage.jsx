import React, { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import HerramientaDiseño from "./HerramientaDiseño";
import DisenosGuardados from "./DisenosGuardados";
import ProtectedRoute from "../ProtectedRoute";
import "./DisenosPage.css";

const DisenosPage = ({ user, loading, mode }) => {
  const { id } = useParams(); // Para /disenos/editar/:id
  const location = useLocation();
  const [error, setError] = useState(null);

  // Determinar qué mostrar basado en la ruta
  const isHerramienta = mode === "crear" || mode === "editar";
  const editarId = mode === "editar" ? id : null;

  return (
    <div className="disenos-page">
      <div className="disenos-content">
        {error && <div className="error-message">{error}</div>}
        {isHerramienta ? (
          <HerramientaDiseño 
            key={editarId || 'new'} // Usar editarId para forzar re-mount
            onError={setError} 
            user={user} 
            editarId={editarId}
          />
        ) : (
          <ProtectedRoute
            user={user}
            requiredPermission="personalizar_productos"
            loading={loading}
          >
            <DisenosGuardados onError={setError} />
          </ProtectedRoute>
        )}
      </div>
    </div>
  );
};

export default DisenosPage;
