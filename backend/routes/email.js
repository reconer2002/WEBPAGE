// Cargar variables de entorno cuando este módulo se ejecute de forma independiente
require('dotenv').config();
const https = require('https');
const { URL } = require('url');

const { 
  FRONTEND_URL, 
  RESEND_API_KEY,
  SMTP_FROM, 
  MAIL_FROM_NAME 
} = process.env;

const getFrontendUrl = () => FRONTEND_URL || 'http://localhost:5173';

// Resend API sender
const sendViaResend = async ({ to, from, subject, html, text }) => {
  return new Promise((resolve, reject) => {
    if (!RESEND_API_KEY) {
      return reject(new Error('RESEND_API_KEY no configurada. Por favor agrega tu API key en el archivo .env'));
    }

    const payload = JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    });

    const opts = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      timeout: 10000,
    };

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
          console.error('[Resend] Error al enviar email:', body);
          const err = new Error(`Resend error ${res.statusCode}: ${body}`);
          err.statusCode = res.statusCode;
          err.body = body;
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Resend] Error de conexión:', err.message);
      reject(err);
    });
    req.on('timeout', () => {
      req.destroy(new Error('Resend request timeout'));
    });
    req.write(payload);
    req.end();
  });
};



const sendVerificationEmail = async ({ to, nombre, token }) => {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada. Por favor agrega tu API key de Resend en el archivo .env');
  }

  // Construir URL de verificación
  const FRONT = FRONTEND_URL || 'http://localhost:5173';
  const url = `${FRONT.replace(/\/$/, '')}/verificar-cuenta?token=${token}`;
  
  // Configurar remitente
  const fromAddress = SMTP_FROM || 'onboarding@resend.dev';
  const fromName = MAIL_FROM_NAME || 'Mentes Creativas Store';
  const from = `${fromName} <${fromAddress}>`;
  
  // Personalizar mensaje
  const displayName = nombre || 'Usuario';
  
  // Texto plano (fallback)
  const plainText = `Hola ${displayName},

Gracias por registrarte en ${fromName}.

Para completar tu registro y verificar tu cuenta, por favor visita el siguiente enlace:

${url}

Este enlace expirará en 24 horas.

Si no solicitaste esta verificación, puedes ignorar este mensaje.

Saludos,
El equipo de ${fromName}`;

  // HTML (versión con estilos)
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">¡Bienvenido a ${fromName}!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${displayName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Gracias por registrarte. Para completar tu registro y verificar tu cuenta, haz clic en el botón de abajo:
    </p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600; font-size: 16px;">
        Verificar mi cuenta
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      O copia y pega este enlace en tu navegador:
    </p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all;">
      ${url}
    </p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 13px; color: #999; margin: 5px 0;">
        Este enlace expirará en 24 horas.
      </p>
      <p style="font-size: 13px; color: #999; margin: 5px 0;">
        Si no solicitaste esta verificación, puedes ignorar este mensaje.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${fromName}. Todos los derechos reservados.</p>
  </div>
</body>
</html>`;

  // Enviar email usando Resend
  return await sendViaResend({
    from,
    to,
    subject: `Verifica tu cuenta - ${fromName}`,
    html: htmlContent,
    text: plainText
  });
};


module.exports = { sendVerificationEmail };