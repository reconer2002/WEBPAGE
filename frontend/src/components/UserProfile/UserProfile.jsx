import React from 'react';
import { useNavigate } from 'react-router-dom';
import profilePic from '../../assets/profilepic.png';

export default function UserProfile({ user, onLogout }) {
  const navigate = useNavigate();

  const tienePermisoMantenedor = user.permisos?.includes('ver_mantenedor');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img 
        src={profilePic}
        alt="Profile" 
        style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
      />
      <div>
        <div><strong>{user.nombre}</strong></div>
        <div>{user.email}</div>
      </div>

      {tienePermisoMantenedor && (
        <button onClick={() => navigate('/mantenedor')} style={{ marginLeft: '12px' }}>
          Mantenedor
        </button>
      )}

      <button onClick={onLogout} style={{ marginLeft: 'auto' }}>
        Logout
      </button>
    </div>
  );
}