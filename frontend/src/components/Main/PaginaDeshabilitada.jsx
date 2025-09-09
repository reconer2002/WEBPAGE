// src/components/Main/PaginaDeshabilitada.jsx
import React, { useState } from "react";
import LoginForm from "../LoginForm/LoginForm";
import authService from "../../services/authService";
import "./PaginaDeshabilitada.css";

const PaginaDeshabilitada = ({ onLogin }) => {
  const [user, setUser] = useState(null);

  const handleLogin = async (userData) => {
    setUser(userData);
    onLogin(userData);
  };

  return (
    <div className="pagina-deshabilitada-container">
      <h2>La página no se encuentra disponible</h2>
      <p>En caso de ser administrador, puedes iniciar sesión aquí:</p>

      {!user ? (
        <div className="login-wrapper">
          <LoginForm onLogin={handleLogin} />
        </div>
      ) : (
        <div className="admin-block">
          <p>Bienvenido <strong>{user.nombre}</strong></p>
          <button
            className="btn"
            onClick={() => {
              authService.logout();
              setUser(null);
              onLogin(null);
            }}
          >
            Logout
          </button>

          {user.permisos.includes("ver_mantenedor") && (
            <a href="/mantenedor" className="btn mantenedor-btn">
              Ir al Mantenedor
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default PaginaDeshabilitada;