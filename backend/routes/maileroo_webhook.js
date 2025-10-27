const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

// POST /webhook/maileroo
// Maileroo will POST delivery/bounce events here if configured in their dashboard.
router.post('/', async (req, res) => {
  try {
    const event = {
      time: new Date().toISOString(),
      ip: req.ip,
      body: req.body,
      headers: req.headers,
    };
    const logLine = JSON.stringify(event) + '\n';
    const logPath = path.join(__dirname, '..', 'logs');
    try {
      if (!fs.existsSync(logPath)) fs.mkdirSync(logPath);
      fs.appendFileSync(path.join(logPath, 'maileroo_events.log'), logLine);
    } catch (e) {
      console.error('No se pudo escribir el log de webhook:', e && e.message ? e.message : e);
    }
    console.log('[Maileroo webhook] evento recibido:', event.body && event.body.event ? event.body.event : event.body);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error procesando webhook de Maileroo:', err);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
