import React, { useState, useEffect } from 'react';
import LoginWidget from '../components/LoginWidget/LoginWidget';
import UserProfile from '../components/UserProfile/UserProfile';
import authService from '../services/authService';

function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Si ya hay token guardado, obtener usuario automáticamente
    const fetchUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <UserProfile user={user} onLogout={handleLogout} />
      ) : (
        <LoginWidget onLogin={setUser} />
      )}
    </div>
  );
}

export default HomePage;