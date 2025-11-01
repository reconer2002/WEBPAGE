// Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import LoginForm from "../LoginForm/LoginForm";
import authService from "../../services/authService";
import paginaService from "../../services/paginaService";
import cartService from "../../services/cartService";

const Header = ({ user, onLogin, onLogout }) => {
  const [logoUrl, setLogoUrl] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogo = async () => {
      const data = await paginaService.getFooterData();
      setLogoUrl(data.logo);
    };
    fetchLogo();

    const handlePaginaUpdated = (e) => {
      if (e?.detail) {
        // Si viene el objeto completo con los datos, usar el logo de ahí
        if (e.detail.logo !== undefined) {
          setLogoUrl(e.detail.logo);
        }
      } else {
        // Si no viene detail, recargar desde el servidor
        fetchLogo();
      }
    };
    window.addEventListener('pagina:updated', handlePaginaUpdated);
    return () => window.removeEventListener('pagina:updated', handlePaginaUpdated);
  }, []);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (user) {
        const count = await cartService.getCount();
        setCartCount(count);
      } else {
        // Limpiar el contador cuando no hay usuario
        setCartCount(0);
      }
    };
    fetchCartCount();

    // Escuchar eventos de actualización del carrito
    const handleCartUpdate = (e) => {
      setCartCount(e.detail.count);
    };
    window.addEventListener("cart:updated", handleCartUpdate);
    return () => window.removeEventListener("cart:updated", handleCartUpdate);
  }, [user]);

  const handleLogout = () => {
    authService.logout();
    setCartCount(0); // Limpiar el contador del carrito
    onLogout();
    navigate("/");
  };

  

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" />
          ) : (
            <span className="logo-placeholder">Logo</span>
          )}
        </Link>
      </div>

      <div className="right-section">
        <div className="user-block">
          {user ? (
            <div className="user-block-logged">
              <span className="welcome-msg">Bienvenido {user.nombre_usuario}</span>
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
              <Link to="/register" className="btn register-link">
                Registrarse
              </Link>
            </div>
          )}
        </div>

        <nav className="sub-nav">
          <Link to="/perfil">Perfil</Link>
          <Link to="/disenos">Tus diseños</Link>
          <Link to="/compras">Mis compras</Link>
          <Link to="/cart" className="nav-cart">
            <div className="cart-container">
              <img
                src="/src/assets/Cart.png"
                alt="Carrito"
                className="cart-icon-inline"
              />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </div>
            Carrito
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;