import React, { useState } from "react";
import HerramientaDiseño from "./HerramientaDiseño";
import DisenosGuardados from "./DisenosGuardados";
import ProtectedRoute from "../ProtectedRoute";
import "./DisenosPage.css";

const DisenosPage = ({ user, loading }) => {
  const [activeTab, setActiveTab] = useState("herramienta");
  const [error, setError] = useState(null);

  const handleTabClick = (tab) => {
    if (tab === "guardados") {
      if (!user) {
        setError("Debes iniciar sesión para ver tus diseños guardados");
        return;
      }
      // Verificar permisos si el usuario no es superadmin
      if (
        user.rol !== "superadmin" &&
        !user.permisos?.includes("personalizar_productos")
      ) {
        setError("No tienes permiso para ver los diseños guardados");
        return;
      }
    }
    setActiveTab(tab);
    setError(null);
  };

  return (
    <div className="disenos-page">
      <nav className="disenos-nav">
        <button
          className={`tab-btn ${activeTab === "herramienta" ? "active" : ""}`}
          onClick={() => handleTabClick("herramienta")}
        >
          Herramienta de Diseño
        </button>
        <button
          className={`tab-btn ${activeTab === "guardados" ? "active" : ""}`}
          onClick={() => handleTabClick("guardados")}
        >
          Diseños Guardados
        </button>
      </nav>

      <div className="disenos-content">
        {error && <div className="error-message">{error}</div>}
        {activeTab === "herramienta" ? (
          <HerramientaDiseño onError={setError} user={user} />
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
