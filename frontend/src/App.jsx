// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Main/Header";
import Footer from "./components/Main/Footer";
import MantenedorPage from "./pages/Mantenedor";
import ProtectedRoute from "./components/ProtectedRoute";
import PaginaDeshabilitada from "./components/Main/PaginaDeshabilitada";
import HomePage from "./pages/HomePage";
import authService from "./services/authService";
import paginaService from "./services/paginaService";
import DisenosPage from "./components/Diseno/DisenosPage";
import EditarDiseno from "./components/Diseno/EditarDiseno";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutMock from "./pages/CheckoutMock";
import CheckoutResult from "./pages/CheckoutResult";
import MisCompras from "./pages/MisCompras";
import Register from "./components/LoginForm/Register";
import Profile from "./pages/Profile";
import VerifyAccount from "./pages/VerifyAccount";
import SearchResults from "./pages/SearchResults";
import { CartProvider } from "./context/CartContext";

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [estadoPagina, setEstadoPagina] = useState(null);
  const [loadingEstadoPagina, setLoadingEstadoPagina] = useState(true);
  const [colores, setColores] = useState({
    color1: "#006a71",
    color2: "#ffffff",
    color3: "#f8f8f8",
  });

  const aplicarColores = (colores) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primario", colores.color1 || "#006a71");
    root.style.setProperty("--color-secundario", colores.color2 || "#ffffff");
    root.style.setProperty("--color-fondo", colores.color3 || "#f8f8f8");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        // Solo loguear errores inesperados, no ausencia de sesión
        console.error("Error inesperado al obtener usuario:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    const fetchEstadoYColores = async () => {
      try {
        const estado = await paginaService.getEstadoPagina();
        setEstadoPagina(!!estado);

        const coloresDB = await paginaService.getColoresPagina();
        setColores(coloresDB);
        aplicarColores(coloresDB);
      } catch (err) {
        console.error("Error obteniendo estado o colores:", err);
        setEstadoPagina(true);
      } finally {
        setLoadingEstadoPagina(false);
      }
    };

    fetchUser();
    fetchEstadoYColores();
  }, []);

  const handleActualizarColores = (nuevosColores) => {
    setColores(nuevosColores);
    aplicarColores(nuevosColores);
  };

  const handleLogin = async (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loadingUser || loadingEstadoPagina) {
    return <div>Cargando...</div>;
  }

  return (
    <Router>
      <CartProvider>
      <Routes>
        <Route
          path="/mantenedor"
          element={
            <>
              <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <ProtectedRoute
                user={user}
                requiredPermission="ver_mantenedor"
                loading={loadingUser}
              >
                <MantenedorPage
                  colores={colores}
                  onActualizarColores={handleActualizarColores}
                />
              </ProtectedRoute>
              <Footer />
            </>
          }
        />

        <Route
          path="/disenos"
          element={
            <>
              <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <DisenosPage user={user} loading={loadingUser} />
              <Footer />
            </>
          }
        />

        <Route
          path="/disenos/crear"
          element={
            <>
              <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <DisenosPage user={user} loading={loadingUser} mode="crear" />
              <Footer />
            </>
          }
        />

        <Route
          path="/disenos/editar/:id"
          element={
            <>
              <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <DisenosPage user={user} loading={loadingUser} mode="editar" />
              <Footer />
            </>
          }
        />

        <Route
          path="/perfil"
          element={
            <>
              <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <ProtectedRoute user={user} requireAuth loading={loadingUser}>
                <Profile user={user} onUserUpdate={setUser} />
              </ProtectedRoute>
              <Footer />
            </>
          }
        />

        <Route
          path="/compras"
          element={
            <>
              <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
              <ProtectedRoute user={user} requireAuth loading={loadingUser}>
                <MisCompras />
              </ProtectedRoute>
              <Footer />
            </>
          }
        />

        <Route
          path="/buscar"
          element={
            <>
              <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <SearchResults />
              <Footer />
            </>
          }
        />

        <Route
          path="/verificar-cuenta"
          element={
            <>
              <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <VerifyAccount onVerified={setUser} />
              <Footer />
            </>
          }
        />

        <Route
          path="/cart"
          element={
            <>
              <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <ProtectedRoute user={user} requireAuth loading={loadingUser}>
                <Cart user={user} />
              </ProtectedRoute>
              <Footer />
            </>
          }
        />

        <Route
          path="/checkout"
          element={
            <>
              <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
              <ProtectedRoute user={user} requireAuth loading={loadingUser}>
                <Checkout />
              </ProtectedRoute>
              <Footer />
            </>
          }
        />

        <Route
          path="/checkout/mock"
          element={
            <>
              <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
              <ProtectedRoute user={user} requireAuth loading={loadingUser}>
                <CheckoutMock />
              </ProtectedRoute>
              <Footer />
            </>
          }
        />

        <Route
          path="/checkout/resultado"
          element={
            <>
              <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
              <ProtectedRoute user={user} requireAuth loading={loadingUser}>
                <CheckoutResult />
              </ProtectedRoute>
              <Footer />
            </>
          }
        />

        <Route
          path="/register"
          element={
            <>
              <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
              <Register onRegister={handleLogin} />
              <Footer />
            </>
          }
        />

        <Route
          path="*"
          element={
            estadoPagina ? (
              <HomePage
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
                colores={colores}
              />
            ) : (
              <PaginaDeshabilitada onLogin={handleLogin} />
            )
          }
        />
      </Routes>
      </CartProvider>
    </Router>
  );
}

export default App;