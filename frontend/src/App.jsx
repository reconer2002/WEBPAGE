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

  // Función para aplicar colores globales como variables CSS
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
      } catch {
        console.log("No hay usuario logueado");
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
        setEstadoPagina(true); // fallback: habilitado
      } finally {
        setLoadingEstadoPagina(false);
      }
    };

    fetchUser();
    fetchEstadoYColores();
  }, []);

  // Función para actualizar colores y aplicarlos al instante
  const handleActualizarColores = (nuevosColores) => {
    setColores(nuevosColores);
    aplicarColores(nuevosColores);
  };

  if (loadingUser || loadingEstadoPagina) {
    return <div>Cargando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Mantenedor solo accesible para admins */}
        <Route
          path="/mantenedor"
          element={
            <>
              <Header user={user} onLogin={setUser} onLogout={() => setUser(null)} />
              <ProtectedRoute
                user={user}
                requiredPermission="ver_mantenedor"
                loading={loadingUser}
              >
                <MantenedorPage colores={colores} onActualizarColores={handleActualizarColores} />
              </ProtectedRoute>
              <Footer />
            </>
          }
        />

        {/* Página principal o deshabilitada */}
        <Route
          path="*"
          element={
            estadoPagina ? (
              <HomePage
                user={user}
                onLogin={setUser}
                onLogout={() => setUser(null)}
                colores={colores}
              />
            ) : (
              <>
                <PaginaDeshabilitada onLogin={setUser} />
                <Footer />
              </>
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;