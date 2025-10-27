import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import authService from "../services/authService";

export default function VerifyAccount({ onVerified }) {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const run = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token no presente en el enlace.");
        return;
      }
      try {
        const res = await authService.verifyEmail(token);
        if (res.success) {
          setStatus("ok");
          setMessage(res.message || "Cuenta verificada correctamente.");
          // Si el backend devolvió un token, guardarlo y cargar el usuario para auto-login
          if (res.token) {
            localStorage.setItem('token', res.token);
            try {
              const me = await authService.getCurrentUser();
              onVerified?.(me);
            } catch (e) {
              console.warn('No se pudo obtener usuario tras verificación automática:', e);
            }
          } else {
            onVerified?.();
          }
          // redirigir al inicio después de mostrar el mensaje de éxito
          setTimeout(() => {
            try { navigate('/'); } catch (e) { /* noop */ }
          }, 3000);
        } else {
          setStatus("error");
          setMessage(res.message || "No se pudo verificar la cuenta.");
        }
      } catch (e) {
        setStatus("error");
        setMessage(e?.message || "No se pudo verificar la cuenta.");
      }
    };
    run();
  }, [params, onVerified]);

  return (
    <div style={{ maxWidth: 560, margin: "32px auto", padding: 16 }}>
      <h2>Verificación de cuenta</h2>
      {status === "checking" && <p>Verificando tu cuenta…</p>}

      {status === 'ok' && (
        <div style={{ marginTop: 12, padding: 16, borderRadius: 8, background: '#e6ffed', border: '1px solid #b7f0c9', color: '#000' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 28, color: '#1b8a3e', marginRight: 12 }}>✅</div>
            <div>
              <strong style={{ display: 'block', marginBottom: 6, color: '#000' }}>¡Cuenta verificada!</strong>
              <div style={{ color: '#000' }}>{message}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>Serás redirigido al inicio en unos segundos...</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={() => navigate('/')}>Ir ahora al inicio</button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: '#a33' }}>{message}</p>
          <button className="btn primary" onClick={() => navigate('/')}>Ir al inicio</button>
        </div>
      )}
    </div>
  );
}

