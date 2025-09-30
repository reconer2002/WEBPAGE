// Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import LoginForm from "../LoginForm/LoginForm";
import authService from "../../services/authService";
import paginaService from "../../services/paginaService";

const Header = ({ user, onLogin, onLogout }) => {
  const [logoUrl, setLogoUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogo = async () => {
      const data = await paginaService.getFooterData();
      setLogoUrl(data.logo);
    };
    fetchLogo();
  }, []);

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="logo">
        <a href="#">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" />
          ) : (
            <span className="logo-placeholder">Logo</span>
          )}
        </a>
      </div>

      <div className="right-section">
        <div className="user-block">
          {user ? (
            <div className="user-block-logged">
              <span className="welcome-msg">Bienvenido {user.nombre}</span>
              <button onClick={handleLogout} className="btn logout-btn">
                Logout
              </button>
              {user.permisos.includes("ver_mantenedor") && (
                <Link to="/mantenedor" className="btn mantenedor-btn">
                  Mantenedor
                </Link>
              )}
            </div>
          ) : (
            <div className="login-inline">
              <LoginForm onLogin={onLogin} />
            </div>
          )}
        </div>

        <nav className="sub-nav">
          <Link to="/perfil">Perfil</Link>
          <Link to="/disenos">Tus diseños</Link>
          <Link to="/cart" className="nav-cart">
            <img
              src="/src/assets/cart.png"
              alt="Carrito"
              className="cart-icon-inline"
            />
            Carrito
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;