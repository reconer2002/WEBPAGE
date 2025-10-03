import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  user,
  requiredPermission,
  children,
  loading,
}) {
  // Mientras se carga el usuario, no redirigimos, mostramos null o un spinner
  if (loading) return null;

  // Si no hay usuario después de cargar, redirige
  if (!user) return <Navigate to="/" replace />;

  // El superadmin siempre tiene acceso
  if (user.rol === "superadmin") return children;

  // Verificar permisos del usuario
  const tienePermiso = user.permisos?.some((permiso) => {
    // Permisos exactos
    if (permiso === requiredPermission) return true;
    // Permisos con wildcard (*)
    if (permiso.endsWith("*")) {
      const prefix = permiso.slice(0, -1);
      return requiredPermission.startsWith(prefix);
    }
    return false;
  });

  if (requiredPermission && !tienePermiso) {
    console.warn(
      `Usuario ${user.nombre} no tiene el permiso requerido: ${requiredPermission}`
    );
    return <Navigate to="/" replace />;
  }

  return children;
}
