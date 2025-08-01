import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

function LoginWidget({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    const result = await authService.login(email, password);

    if (result.success) {
      const userData = await authService.getCurrentUser();
      alert('Sesión iniciada correctamente');
      if (onLogin) onLogin(userData); // actualizar estado si se pasa onLogin
    } else {
      alert(result.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      background: '#eee',
      padding: '1rem',
      borderRadius: '8px',
      width: '250px'
    }}>
      <h4>Iniciar sesión</h4>
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
      />
      <button onClick={handleLogin} style={{ width: '100%' }}>Entrar</button>
      <div style={{ marginTop: '0.5rem' }}>
        <button onClick={() => navigate('/registro')} style={{ width: '100%' }}>Registrarse</button>
      </div>
    </div>
  );
}

export default LoginWidget;