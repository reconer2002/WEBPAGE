const nodemailer = require('nodemailer');
const path = require('path');

// Configurar el transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Envía un email con el documento PDF adjunto
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Email del destinatario
 * @param {string} options.subject - Asunto del email
 * @param {string} options.text - Texto del email
 * @param {string} options.attachmentPath - Ruta del archivo PDF
 * @param {string} options.attachmentName - Nombre del archivo adjunto
 */
async function enviarEmailConDocumento(options) {
  try {
    // Verificar que el transporter esté configurado
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP no configurado. Email no enviado:', options.to);
      return { success: false, message: 'SMTP no configurado' };
    }

    const mailOptions = {
      from: `"Mentes Creativas Store" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html || options.text,
      attachments: options.attachmentPath ? [{
        filename: options.attachmentName || path.basename(options.attachmentPath),
        path: options.attachmentPath
      }] : []
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía la boleta por email
 */
async function enviarBoleta(email, pdfPath, pedidoId) {
  const subject = `Boleta Electrónica - Pedido #${pedidoId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #006a71;">¡Gracias por tu compra!</h2>
      <p>Hola,</p>
      <p>Adjuntamos tu boleta electrónica correspondiente al pedido <strong>#${pedidoId}</strong>.</p>
      <p>Puedes revisar el estado de tu envío en tu cuenta de <strong>Mentes Creativas Store</strong>.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        Este es un email automático, por favor no respondas a este mensaje.<br>
        Si tienes alguna consulta, contáctanos a través de nuestro sitio web.
      </p>
    </div>
  `;

  return await enviarEmailConDocumento({
    to: email,
    subject,
    html,
    attachmentPath: pdfPath,
    attachmentName: `boleta_${pedidoId}.pdf`
  });
}

/**
 * Envía la factura por email
 */
async function enviarFactura(email, pdfPath, pedidoId) {
  const subject = `Factura Electrónica - Pedido #${pedidoId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #006a71;">¡Gracias por tu compra!</h2>
      <p>Estimado/a cliente,</p>
      <p>Adjuntamos tu factura electrónica correspondiente al pedido <strong>#${pedidoId}</strong>.</p>
      <p>Puedes revisar el estado de tu envío en tu cuenta de <strong>Mentes Creativas Store</strong>.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        Este es un email automático, por favor no respondas a este mensaje.<br>
        Si tienes alguna consulta, contáctanos a través de nuestro sitio web.
      </p>
    </div>
  `;

  return await enviarEmailConDocumento({
    to: email,
    subject,
    html,
    attachmentPath: pdfPath,
    attachmentName: `factura_${pedidoId}.pdf`
  });
}

module.exports = {
  enviarEmailConDocumento,
  enviarBoleta,
  enviarFactura
};
