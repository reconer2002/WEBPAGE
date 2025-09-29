import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import LoginForm from "../LoginForm/LoginForm";
import authService from "../../services/authService";
import paginaService from "../../services/paginaService";
import cartService from "../../services/cartService";

const Header = () => {
  const [user, setUser] = useState(null);
  const [logoUrl, setLogoUrl] = useState(""); // <-- estado para logo
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  // Obtener usuario actual al montar el componente
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch {
        console.log("No hay usuario logueado");
      }
    };

    fetchUser();
  }, []);

  // Obtener logo desde backend
  useEffect(() => {
    const fetchLogo = async () => {
      const data = await paginaService.getFooterData(); // reutilizamos el service
      setLogoUrl(data.logo);
    };
    fetchLogo();
  }, []);

  // Contador del carrito (localStorage + eventos)
  useEffect(() => {
    // valor inicial
    setCartCount(cartService.getCount());

    const onCart = (e) => {
      setCartCount(e.detail?.count ?? cartService.getCount());
    };
    const onStorage = (e) => {
      if (e.key === 'cart_v1') setCartCount(cartService.getCount());
    };
    window.addEventListener('cart:updated', onCart);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('cart:updated', onCart);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate("/"); // Redirige a la página principal al hacer logout
  };

  const handleLogin = (userData) => {
    setUser(userData);
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
        {/* Bloque de usuario o login */}
        <div className="user-block">
          {user ? (
            <div className="user-block-logged">
              <span className="welcome-msg">Bienvenido {user.nombre}</span>
              <button onClick={handleLogout} className="btn logout-btn">
                Logout
              </button>
              {user.permisos.includes("ver_mantenedor") && (
                <a href="/mantenedor" className="btn mantenedor-btn">
                  Mantenedor
                </a>
              )}
            </div>
          ) : (
            <div className="login-inline">
              <LoginForm onLogin={handleLogin} />
            </div>
          )}
        </div>

        {/* Navbar secundaria */}
        <nav className="sub-nav">
          <a href="/perfil">Perfil</a>
          <a href="/diseños">Tus diseños</a>
          <a href="/cart" className="nav-cart">
            <img
              src="/src/assets/cart.png"
              alt="Carrito"
              className="cart-icon-inline"
            />
            Carrito
            {cartCount > 0 && (
              <span className="cart-badge" aria-label={`Artículos en carrito: ${cartCount}`}>{cartCount}</span>
            )}
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
