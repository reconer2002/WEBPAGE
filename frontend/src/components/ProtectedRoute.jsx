import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, requiredPermission, children }) {
  if (!user) return <Navigate to="/" replace />;

  if (requiredPermission && !user.permisos?.includes(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}