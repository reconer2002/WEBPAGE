import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Main/Header";
import MantenedorPage from "./pages/Mantenedor";
import ProtectedRoute from "./components/ProtectedRoute";
import authService from "./services/authService";

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

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

    fetchUser();
  }, []);

  return (
    <Router>
      <Header user={user} onLogin={setUser} onLogout={() => setUser(null)} />

      <Routes>
        <Route
          path="/mantenedor"
          element={
            <ProtectedRoute
              user={user}
              requiredPermission="ver_mantenedor"
              loading={loadingUser}
            >
              <MantenedorPage />
            </ProtectedRoute>
          }
        />
        {/* Otras rutas */}
      </Routes>
    </Router>
  );
}

export default App;