import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, requiredPermission, requireAuth = false, children, loading }) {
  // Mientras se carga el usuario, no redirigimos, mostramos null o un spinner
  if (loading) return null;

  // Si no se pide permiso específico y tampoco requireAuth, no exigimos autenticación
  if (!requiredPermission && !requireAuth) {
    return children;
  }

  // Si se requiere autenticación o permiso: exigir sesión
  if (!user) return <Navigate to="/" replace />;
  if (requiredPermission && !user.permisos?.includes(requiredPermission)) {
    return <Navigate to="/" replace />;
  }
  return children;
}