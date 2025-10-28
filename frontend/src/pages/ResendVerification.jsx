import React, { useState } from 'react';
import api from '../services/api';

export default function ResendVerification() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const { data } = await api.post('/auth/verify/resend', { email });
      setMessage(data?.message || 'Se envió el correo de verificación.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'No se pudo reenviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '36px auto', padding: 16 }}>
      <h2>📩 Reenviar correo de verificación</h2>
      <form onSubmit={onSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ display: 'block', marginTop: 6, padding: '8px 10px', width: '100%' }} />
        </label>
        <button className="btn primary" disabled={loading}>{loading ? 'Enviando...' : 'Enviar nuevo correo 🔁'}</button>
      </form>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}