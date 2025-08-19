import React, { useState } from "react";
import authService from "../../services/authService";

const LoginForm = ({ user, onLogin, onLogout }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const result = await authService.login(username, password);

    if (result.success) {
      // Obtener datos completos del usuario
      const currentUser = await authService.getCurrentUser();
      onLogin(currentUser); // pasar al Header
      setUsername("");
      setPassword("");
    } else {
      alert(result.message); // opcional, notificación
    }
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  if (user) {
    return (
      <div className="login-container">
        <button onClick={handleLogout} className="btn">
          Logout
        </button>
      </div>
    );
  }

  return (
    <form className="login-form" onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className="btn">
        Login
      </button>
      <a href="/register" className="btn">
        Registrarse
      </a>
    </form>
  );
};

export default LoginForm;