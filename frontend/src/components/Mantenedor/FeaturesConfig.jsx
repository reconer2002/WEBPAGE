import React, { useState, useEffect } from 'react';
import featuresService from '../../services/featuresService';
import './FeaturesConfig.css';

const FeaturesConfig = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, feature: null, newStatus: false });

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const data = await featuresService.getAllFeatures();
      setFeatures(data);
    } catch (error) {
      console.error('Error cargando funcionalidades:', error);
      setMessage({ type: 'error', text: 'Error al cargar funcionalidades' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = (feature) => {
    const newStatus = !feature.is_enabled;
    setConfirmDialog({
      show: true,
      feature: feature,
      newStatus: newStatus
    });
  };

  const confirmToggle = async () => {
    const { feature, newStatus } = confirmDialog;
    setConfirmDialog({ show: false, feature: null, newStatus: false });
    
    try {
      setSaving(true);
      const updated = await featuresService.updateFeature(feature.id, newStatus);
      setFeatures(features.map(f => f.id === feature.id ? updated : f));
      setMessage({ 
        type: 'success', 
        text: `Funcionalidad ${newStatus ? 'activada' : 'suspendida'} correctamente` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error actualizando funcionalidad:', error);
      setMessage({ type: 'error', text: 'Error al actualizar funcionalidad' });
    } finally {
      setSaving(false);
    }
  };

  const cancelToggle = () => {
    setConfirmDialog({ show: false, feature: null, newStatus: false });
  };

  const handleBulkUpdate = async (updates) => {
    try {
      setSaving(true);
      const updated = await featuresService.bulkUpdateFeatures(updates);
      setFeatures(updated);
      setMessage({ type: 'success', text: 'Funcionalidades actualizadas correctamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error actualizando funcionalidades:', error);
      setMessage({ type: 'error', text: 'Error al actualizar funcionalidades' });
    } finally {
      setSaving(false);
    }
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    const category = feature.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {});

  const categoryNames = {
    design: 'Diseño',
    commerce: 'Comercio',
    account: 'Cuenta de Usuario',
    content: 'Contenido',
    general: 'General'
  };

  if (loading) {
    return (
      <div className="features-config">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="features-config">
      <div className="features-header">
        <h2>⚙️ Configuración de Funcionalidades</h2>
        <p className="features-subtitle">
          Activa o desactiva funcionalidades de la plataforma para los usuarios
        </p>
      </div>

      {message.text && (
        <div className={`features-message ${message.type}`}>
          {message.type === 'success' ? '✓' : '⚠'} {message.text}
        </div>
      )}

      <div className="features-groups">
        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
          <div key={category} className="features-category">
            <h3 className="category-title">
              {categoryNames[category] || category}
            </h3>
            <div className="features-list">
              {categoryFeatures.map(feature => (
                <div key={feature.id} className="feature-item">
                  <div className="feature-info">
                    <div className="feature-name">{feature.feature_name}</div>
                    <div className="feature-description">{feature.description}</div>
                    <div className="feature-key">
                      <code>{feature.feature_key}</code>
                    </div>
                  </div>
                  <div className="feature-control">
                    <button
                      className={`feature-toggle-btn ${feature.is_enabled ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleClick(feature)}
                      disabled={saving}
                    >
                      {feature.is_enabled ? '✓ Activa' : '⊗ Suspendida'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="features-footer">
        <p className="info-text">
          ℹ️ Los cambios se aplican inmediatamente. Los usuarios verán las funcionalidades 
          deshabilitadas ocultas o inaccesibles.
        </p>
      </div>

      {/* Modal de confirmación */}
      {confirmDialog.show && (
        <div className="confirm-modal-overlay" onClick={cancelToggle}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <h3>Confirmar Cambio</h3>
            </div>
            <div className="confirm-modal-body">
              <p>
                ¿Estás seguro de que deseas <strong>
                  {confirmDialog.newStatus ? 'activar' : 'suspender'}
                </strong> la funcionalidad?
              </p>
              <div className="confirm-feature-name">
                {confirmDialog.feature?.feature_name}
              </div>
              <p className="confirm-warning">
                {confirmDialog.newStatus 
                  ? '✓ Los usuarios podrán acceder a esta funcionalidad.'
                  : '⚠️ Los usuarios no podrán acceder a esta funcionalidad hasta que la reactives.'}
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button 
                className="confirm-btn cancel"
                onClick={cancelToggle}
              >
                Cancelar
              </button>
              <button 
                className={`confirm-btn ${confirmDialog.newStatus ? 'activate' : 'suspend'}`}
                onClick={confirmToggle}
              >
                {confirmDialog.newStatus ? 'Activar' : 'Suspender'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturesConfig;
