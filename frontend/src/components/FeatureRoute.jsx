import React from 'react';
import { useFeatures } from '../context/FeaturesContext';
import FuncionalidadDeshabilitada from './FuncionalidadDeshabilitada';

const featureNames = {
  design_tool: 'La herramienta de diseño',
  saved_designs: 'Los diseños guardados',
  shopping_cart: 'El carrito de compras',
  checkout: 'El proceso de pago',
  user_profile: 'El perfil de usuario',
  order_history: 'El historial de compras',
  product_catalog: 'El catálogo de productos',
  testimonials: 'Los testimonios'
};

/**
 * Componente para proteger rutas basadas en funcionalidades activadas/desactivadas
 */
const FeatureRoute = ({ children, featureKey, user }) => {
  const { isFeatureEnabled, loading } = useFeatures();

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Verificar si el usuario tiene permiso para configurar la página
  // Si lo tiene, puede acceder aunque la funcionalidad esté deshabilitada
  const hasConfigPermission = user?.permisos?.includes('configurar_pagina') || false;

  if (!isFeatureEnabled(featureKey) && !hasConfigPermission) {
    return <FuncionalidadDeshabilitada featureName={featureNames[featureKey] || 'Esta funcionalidad'} />;
  }

  return children;
};

export default FeatureRoute;
