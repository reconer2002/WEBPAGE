const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const permisos = require('../middleware/permisos');

// Obtener todas las funcionalidades (público - solo las habilitadas)
router.get('/enabled', async (req, res) => {
  try {
    const [features] = await db.query(
      'SELECT feature_key, is_enabled FROM features_config'
    );
    
    // Convertir a objeto para fácil acceso en frontend
    const featuresMap = {};
    features.forEach(f => {
      featuresMap[f.feature_key] = f.is_enabled === 1 || f.is_enabled === true;
    });
    
    res.json(featuresMap);
  } catch (error) {
    console.error('Error obteniendo funcionalidades habilitadas:', error);
    res.status(500).json({ error: 'Error al obtener funcionalidades' });
  }
});

// Obtener todas las funcionalidades (admin)
router.get('/', auth, permisos('configurar_pagina'), async (req, res) => {
  try {
    const [features] = await db.query(
      'SELECT * FROM features_config ORDER BY category, feature_name'
    );
    res.json(features);
  } catch (error) {
    console.error('Error obteniendo funcionalidades:', error);
    res.status(500).json({ error: 'Error al obtener funcionalidades' });
  }
});

// Actualizar estado de una funcionalidad
router.put('/:id', auth, permisos('configurar_pagina'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_enabled } = req.body;
    
    if (typeof is_enabled !== 'boolean') {
      return res.status(400).json({ error: 'is_enabled debe ser un booleano' });
    }
    
    await db.query(
      'UPDATE features_config SET is_enabled = ? WHERE id = ?',
      [is_enabled, id]
    );
    
    const [updated] = await db.query(
      'SELECT * FROM features_config WHERE id = ?',
      [id]
    );
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Error actualizando funcionalidad:', error);
    res.status(500).json({ error: 'Error al actualizar funcionalidad' });
  }
});

// Actualizar múltiples funcionalidades
router.put('/bulk/update', auth, permisos('gestionar_sistema'), async (req, res) => {
  try {
    const { updates } = req.body; // Array de { id, is_enabled }
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'updates debe ser un array' });
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const update of updates) {
        await connection.query(
          'UPDATE features_config SET is_enabled = ? WHERE id = ?',
          [update.is_enabled, update.id]
        );
      }
      
      await connection.commit();
      
      const [features] = await db.query(
        'SELECT * FROM features_config ORDER BY category, feature_name'
      );
      
      res.json(features);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error actualizando funcionalidades:', error);
    res.status(500).json({ error: 'Error al actualizar funcionalidades' });
  }
});

module.exports = router;
