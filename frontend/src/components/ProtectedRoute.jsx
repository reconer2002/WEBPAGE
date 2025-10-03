import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, requiredPermission, children, loading }) {
  // Mientras se carga el usuario, no redirigimos, mostramos null o un spinner
  if (loading) return null;

  // Si no hay usuario después de cargar, redirige
  if (!user) return <Navigate to="/" replace />;

  // Si hay permiso requerido y el usuario no lo tiene, redirige
  if (requiredPermission && !user.permisos?.includes(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}