// Cargar variables de entorno cuando este módulo se ejecute de forma independiente
require('dotenv').config();
const https = require('https');
const { URL } = require('url');

const { FRONTEND_URL, MAILEROO_API_KEY, MAILEROO_API_URL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM, MAILER_SEND_METHOD } = process.env;

const getFrontendUrl = () => FRONTEND_URL || 'http://localhost:5173';

// Maileroo HTTP sender (simple wrapper). Requires MAILEROO_API_KEY and MAILEROO_API_URL
const sendViaMaileroo = async ({ to, from, subject, html }) => {
  return new Promise((resolve, reject) => {
    if (!MAILEROO_API_KEY) return reject(new Error('MAILEROO_API_KEY no configurada'));
    const apiUrl = MAILEROO_API_URL || 'https://smtp.maileroo.com/api/v2/emails';
    let parsed;
    try {
      parsed = new URL(apiUrl);
    } catch (e) {
      return reject(new Error('MAILEROO_API_URL inválida'));
    }
    const payload = JSON.stringify({
      from: typeof from === 'string' ? { address: from, name: 'TuSitio' } : from,
      to: Array.isArray(to) ? to : [{ address: to, name: 'Usuario' }],
      subject,
      html
    });

    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${MAILEROO_API_KEY}`,
      },
      timeout: 10000,
    };
    console.log('DEBUG: Maileroo request ->', `${parsed.protocol}//${parsed.hostname}${parsed.pathname}${parsed.search || ''}`);
    console.log('DEBUG: Maileroo payload (truncated) ->', payload.slice(0, 200));

    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            resolve(parsedBody);
          } catch (e) {
            resolve({ raw: body });
          }
        } else {
          const err = new Error(`Maileroo error ${res.statusCode}: ${body}`);
          err.statusCode = res.statusCode;
          err.body = body;
          reject(err);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy(new Error('Maileroo request timeout'));
    });
    req.write(payload);
    req.end();
  });
};



const sendVerificationEmail = async ({ to, nombre, token }) => {
  const method = (MAILER_SEND_METHOD || 'maileroo').toLowerCase();
  if (method === 'maileroo' && !MAILEROO_API_KEY) {
    throw new Error('MAILEROO_API_KEY no configurada. Configura la variable de entorno para enviar correos o cambia MAILER_SEND_METHOD a "smtp".');
  }

  // Construir el cuerpo exactamente como el ejemplo
  const FRONT = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = `${FRONT.replace(/\/$/, '')}/verificar-cuenta?token=${token}`;
  const fromAddress = process.env.SMTP_FROM || 'sandbox@de8b045bddd81511.maileroo.org';
  const fromName = process.env.MAIL_FROM_NAME || 'TuSitio';
  // Personalizar saludo con el nombre proporcionado
  const displayName = nombre || 'Usuario';
  const plainText = `Hola ${displayName},\n\nGracias por registrarte.\n\nVisita el siguiente enlace para verificar tu cuenta:\n${url}\n\nSi no solicitaste esto, ignora este mensaje.`;

  const body = {
    from: {
      address: fromAddress,
      name: fromName
    },
    to: [
      {
        address: typeof to === 'string' ? to : (to[0]?.address || ''),
        name: displayName
      }
    ],
    subject: 'Verifica tu cuenta',
    html: `<p>Hola ${displayName},</p><p>Gracias por registrarte.</p><p>Haz clic en el siguiente enlace para verificar tu cuenta:</p><p><a href='${url}'>Verificar cuenta</a></p>`,
    text: plainText,
    // Maileroo rejects some custom headers (e.g. Reply-To), so only include safe custom headers.
    headers: {
      'X-Mailer': 'TuSitio Mailer'
    }
  };
  // If method is smtp, use nodemailer
  if (method === 'smtp') {
    if (!SMTP_HOST || !SMTP_PORT) throw new Error('SMTP_HOST/SMTP_PORT no configurados para envío por SMTP');
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    const mailOptions = {
      from: `${fromName} <${fromAddress}>`,
      to: Array.isArray(body.to) ? body.to.map(t => `${t.name} <${t.address}>`).join(',') : body.to,
      subject: body.subject,
      html: body.html,
      text: body.text,
      headers: body.headers,
      replyTo: fromAddress,
    };
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('[SMTP] Email enviado correctamente:', info);
      return { provider: 'smtp', info };
    } catch (smtpErr) {
      console.error('[SMTP] Error al enviar email:', smtpErr && smtpErr.message ? smtpErr.message : smtpErr);
      throw smtpErr;
    }
  }

  // Default: use Maileroo
  return new Promise((resolve, reject) => {
    const apiUrl = MAILEROO_API_URL || 'https://smtp.maileroo.com/api/v2/emails';
    const { URL } = require('url');
    const parsed = new URL(apiUrl);
    const payload = JSON.stringify(body);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${MAILEROO_API_KEY}`,
      },
      timeout: 10000,
    };
    const https = require('https');
    const req = https.request(opts, (res) => {
      let bodyResp = '';
      res.on('data', (d) => (bodyResp += d));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedBody = bodyResp ? JSON.parse(bodyResp) : {};
            console.log('[Maileroo] Email enviado correctamente:', parsedBody);
            resolve({ provider: 'maileroo', resp: parsedBody });
          } catch (e) {
            resolve({ provider: 'maileroo', raw: bodyResp });
          }
        } else {
          console.error('[Maileroo] Error al enviar email:', bodyResp);
          reject(new Error(`Maileroo error ${res.statusCode}: ${bodyResp}`));
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy(new Error('Maileroo request timeout'));
    });
    req.write(payload);
    req.end();
  });
};


module.exports = { sendVerificationEmail };