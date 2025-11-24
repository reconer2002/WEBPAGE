import React, { createContext, useContext, useState, useEffect } from 'react';
import featuresService from '../services/featuresService';

const FeaturesContext = createContext();

export const useFeatures = () => {
  const context = useContext(FeaturesContext);
  if (!context) {
    throw new Error('useFeatures debe usarse dentro de FeaturesProvider');
  }
  return context;
};

export const FeaturesProvider = ({ children }) => {
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const enabledFeatures = await featuresService.getEnabledFeatures();
      setFeatures(enabledFeatures);
      setMaintenanceMode(enabledFeatures.site_maintenance === true);
    } catch (error) {
      console.error('Error cargando funcionalidades:', error);
      // En caso de error, habilitar todo por defecto
      setFeatures({
        design_tool: true,
        saved_designs: true,
        shopping_cart: true,
        checkout: true,
        user_profile: true,
        order_history: true,
        product_catalog: true,
        testimonials: true,
        site_maintenance: false
      });
      setMaintenanceMode(false);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (featureKey) => {
    return features[featureKey] === true;
  };

  const refreshFeatures = () => {
    loadFeatures();
  };

  return (
    <FeaturesContext.Provider value={{ features, loading, isFeatureEnabled, refreshFeatures, maintenanceMode }}>
      {children}
    </FeaturesContext.Provider>
  );
};
