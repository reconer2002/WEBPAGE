const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  SMTP_FROM,
  FRONTEND_URL,
} = process.env;

let transporter;

const ensureTransporter = () => {
  if (transporter) return transporter;

  if (!SMTP_HOST || !SMTP_PORT) {
    throw new Error('Configuración SMTP incompleta.');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  return transporter;
};

const getFrontendUrl = () => FRONTEND_URL || 'http://localhost:5173';

const sendVerificationEmail = async ({ to, nombre, token }) => {
  const url = `${getFrontendUrl()}/verificar-cuenta?token=${token}`;
  const mailOptions = {
    from: SMTP_FROM || SMTP_USER,
    to,
    subject: 'Verifica tu cuenta',
    html: `
      <p>Hola ${nombre || 'usuario'},</p>
      <p>Gracias por registrarte. Haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <p><a href="${url}">${url}</a></p>
      <p>Si no solicitaste esta verificación, puedes ignorar este mensaje.</p>
    `,
  };

  const mailer = ensureTransporter();
  await mailer.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
};
