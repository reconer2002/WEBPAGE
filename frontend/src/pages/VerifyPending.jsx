import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export default function VerifyPending() {
  const { state } = useLocation();
  const email = state?.email || '';
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const resend = async () => {
    setLoading(true);
    setMessage('');
    try {
      // If user is authenticated send via protected endpoint
      const res = await authService.sendVerificationEmail();
      if (res.success) {
        setMessage('✅ Te hemos enviado un nuevo correo de verificación. Revisa tu bandeja o spam.');
      } else {
        setMessage(res.message || 'No se pudo enviar el correo.');
      }
    } catch (e) {
      setMessage(e?.message || 'Error al reenviar correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '36px auto', padding: 16 }}>
      <h2>📩 Verifica tu cuenta</h2>
      <p>Te enviamos un correo de verificación a:</p>
      <p style={{ fontWeight: 700 }}>{email || 'tu correo'}</p>
      <p>Revisa tu bandeja de entrada o la carpeta de spam.</p>
      <div style={{ marginTop: 18 }}>
        <button className="btn primary" onClick={resend} disabled={loading}>{loading ? 'Enviando...' : 'Reenviar correo 🔁'}</button>
        <button className="btn" style={{ marginLeft: 8 }} onClick={() => navigate('/')}>Ir al inicio</button>
      </div>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}