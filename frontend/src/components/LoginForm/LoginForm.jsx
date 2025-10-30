import React, { useState } from "react";
import authService from "../../services/authService";
import "./Register.css";

// --- 🛑 1. IMPORTA TU ARCHIVO DE ANALYTICS ---
// (Asegúrate de que esta ruta sea la correcta para tu proyecto)
import { Analytics } from "../../services/analytics";

export default function LoginForm({ onLogin }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError(null);
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    setResendLoading(true);
    setResendMessage(null);
    
    try {
      const result = await authService.resendVerificationEmail(unverifiedEmail);
      if (result.success) {
        setResendMessage(result.message || 'Correo enviado exitosamente');
      } else {
        setResendMessage(result.message || 'Error al enviar el correo');
      }
    } catch (err) {
      setResendMessage('Error al reenviar correo de verificación');
    } finally {
      setResendLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowResendDialog(false);
    setResendMessage(null);

    try {
      const res = await authService.login(form.username, form.password);

      if (res.success) {

        // --- 🛑 2. IMPLEMENTACIÓN DE GOOGLE ANALYTICS ---
        
        // Asigna el User-ID (anónimo) para rastrear al usuario
        // Asumimos que `res.user.id` existe y es un ID de tu BD
        if (res.user && res.user.id) {
          Analytics.setUserId(res.user.id);
        } else {
          console.warn("GA: No se encontró res.user.id para asignar el User-ID.");
        }

        // Envía el evento de 'login'
        Analytics.trackEvent("login", {
          category: "Authentication",
          label: "standard-login",
        });
        
        // --- FIN DE GOOGLE ANALYTICS ---

        // Tu lógica original
        onLogin?.(res.user);

      } else {
        // Manejar error de cuenta no verificada
        if (res.status === 403 && res.canResend) {
          setUnverifiedEmail(res.email);
          setShowResendDialog(true);
          setError(
            `${res.message || 'Cuenta no verificada'}\n\n` +
            `Por favor revisa tu correo (${res.email || form.username}) y haz clic en el enlace de verificación.`
          );
        } else {
          setError(res.message || "Credenciales incorrectas");
        }
      }
    } catch (err) {
      setError(err?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={onSubmit} className="register-form">
        <label className="register-field">
          Usuario o Email
          <input
            name="username"
            value={form.username}
            onChange={onChange}
            required
            placeholder="Tu usuario o email"
            className="register-input"
          />
        </label>

        <label className="register-field">
          Contraseña
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            placeholder="Tu contraseña"
            className="register-input"
          />
        </label>

        {error && <div className="error-message" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

        {showResendDialog && (
          <div className="verification-dialog" style={{ 
            marginTop: '15px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              ¿No recibiste el correo de verificación?
            </p>
            <button 
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="register-button"
              style={{ 
                width: '100%', 
                padding: '10px',
                backgroundColor: '#6c757d',
                marginBottom: resendMessage ? '10px' : '0'
              }}
            >
              {resendLoading ? "Enviando..." : "Reenviar correo de verificación"}
            </button>
            {resendMessage && (
              <div style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#d1ecf1', 
                color: '#0c5460',
                borderRadius: '4px',
                fontSize: '13px'
              }}>
                {resendMessage}
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} className="register-button">
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
}