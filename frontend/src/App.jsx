import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MantenedorPage from './pages/Mantenedor';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/authService';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    };

    fetchUser();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage user={user} setUser={setUser} />} />
        <Route
          path="/mantenedor"
          element={
            <ProtectedRoute user={user} requiredPermission="ver_mantenedor">
              <MantenedorPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;