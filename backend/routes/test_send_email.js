require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sendVerificationEmail } = require('./email');

// Debug info to help diagnose .env loading issues
try {
  console.log('DEBUG: cwd=', process.cwd());
  const rawKey = process.env.MAILEROO_API_KEY;
  if (rawKey) {
    console.log('DEBUG: MAILEROO_API_KEY visible to process (masked) =', rawKey.slice(0,4) + '...' + rawKey.slice(-4), `(len=${rawKey.length})`);
  } else {
    console.log('DEBUG: MAILEROO_API_KEY not present in process.env');
  }
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const buf = fs.readFileSync(envPath);
    console.log('DEBUG: .env exists at', envPath, 'size=', buf.length, 'bytes');
    console.log('DEBUG: .env starts=', buf.toString('utf8',0,200).replace(/\r/g,'\\r').replace(/\n/g,'\\n'));
  } else {
    console.log('DEBUG: .env not found at', envPath);
  }
} catch (e) {
  console.error('DEBUG: error reading .env', e && e.message ? e.message : e);
}

async function run() {
  const to = process.argv[2];
  const nombre = process.argv[3] || 'Tester';
  const token = process.argv[4] || 'test-token-123';

  if (!to) {
    console.error('Uso: node scripts/test_send_email.js <email> [nombre] [token]');
    process.exit(1);
  }

  try {
    const resp = await sendVerificationEmail({ to, nombre, token });
    console.log('Envío OK:', resp);
    process.exit(0);
  } catch (err) {
    console.error('Envío fallido:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(2);
  }
}

run();