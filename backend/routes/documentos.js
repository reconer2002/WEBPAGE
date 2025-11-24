const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const verifyPermiso = require('../middleware/permisos');
const { generarBoletaPDF, generarFacturaPDF } = require('../services/documentGenerator');

const docsDir = path.join(__dirname, '..', 'documentos');

// GET /api/documentos/boleta/:pedidoId - Generar/descargar boleta
router.get('/boleta/:pedidoId', auth, verifyPermiso('ver_mantenedor'), async (req, res) => {
  try {
    const { pedidoId } = req.params;

    // Obtener datos de la boleta desde la BD
    const [[boleta]] = await req.db.query(`
      SELECT b.*, p.costo
      FROM boletas b
      JOIN pedidos p ON p.id = b.pedido_id
      WHERE b.pedido_id = ?
    `, [pedidoId]);

    if (!boleta) {
      return res.status(404).json({ error: 'Boleta no encontrada' });
    }

    // Obtener items del pedido
    const [items] = await req.db.query(`
      SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(dp.datos, '$.name')) AS name,
        dp.costo AS price,
        COUNT(*) AS quantity
      FROM disenos_pedido dp
      WHERE dp.pedido_id = ?
      GROUP BY name, price
    `, [pedidoId]);

    const boletaData = {
      pedido_id: boleta.pedido_id,
      nombre_responsable: boleta.nombre_responsable,
      rut_responsable: boleta.rut_responsable,
      razon_social: boleta.razon_social,
      direccion_casa_matriz: boleta.direccion_casa_matriz,
      telefono_contacto: boleta.telefono_contacto,
      gmail: boleta.gmail,
      direccion_web: boleta.direccion_web,
      fecha_emision: boleta.fecha_emision,
      monto: boleta.monto,
      items: items
    };

    const pdfPath = await generarBoletaPDF(boletaData);
    
    res.download(pdfPath, `boleta_${pedidoId}.pdf`, (err) => {
      if (err) {
        console.error('Error descargando boleta:', err);
      }
      // Opcional: eliminar el archivo después de descargarlo
      // fs.unlinkSync(pdfPath);
    });

  } catch (error) {
    console.error('Error generando boleta:', error);
    res.status(500).json({ error: 'Error al generar boleta' });
  }
});

// GET /api/documentos/factura/:pedidoId - Generar/descargar factura
router.get('/factura/:pedidoId', auth, verifyPermiso('ver_mantenedor'), async (req, res) => {
  try {
    const { pedidoId } = req.params;

    // Obtener datos de la factura desde la BD
    const [[factura]] = await req.db.query(`
      SELECT f.*, p.costo
      FROM facturas f
      JOIN pedidos p ON p.id = f.pedido_id
      WHERE f.pedido_id = ?
    `, [pedidoId]);

    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    // Obtener items del pedido
    const [items] = await req.db.query(`
      SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(dp.datos, '$.name')) AS name,
        dp.costo AS price,
        COUNT(*) AS quantity
      FROM disenos_pedido dp
      WHERE dp.pedido_id = ?
      GROUP BY name, price
    `, [pedidoId]);

    const facturaData = {
      pedido_id: factura.pedido_id,
      nombre_responsable: factura.nombre_responsable,
      rut_responsable: factura.rut_responsable,
      razon_social: factura.razon_social,
      direccion_casa_matriz: factura.direccion_casa_matriz,
      telefono_contacto: factura.telefono_contacto,
      nombre_cliente: factura.nombre_cliente,
      rut_cliente: factura.rut_cliente,
      giro: factura.giro,
      direccion: factura.direccion,
      comuna: factura.comuna,
      telefono: factura.telefono,
      ciudad: factura.ciudad,
      referencia: factura.referencia,
      fecha_emision: factura.fecha_emision || new Date(),
      monto: factura.monto || factura.costo,
      items: items
    };

    const pdfPath = await generarFacturaPDF(facturaData);
    
    res.download(pdfPath, `factura_${pedidoId}.pdf`, (err) => {
      if (err) {
        console.error('Error descargando factura:', err);
      }
      // Opcional: eliminar el archivo después de descargarlo
      // fs.unlinkSync(pdfPath);
    });

  } catch (error) {
    console.error('Error generando factura:', error);
    res.status(500).json({ error: 'Error al generar factura' });
  }
});

module.exports = router;
