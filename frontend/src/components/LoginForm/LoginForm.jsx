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

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          setError(
            `${res.message || 'Cuenta no verificada'}\n\n` +
            `Por favor revisa tu correo (${res.email || form.username}) y haz clic en el enlace de verificación.\n` +
            `Si no recibiste el correo, verifica tu carpeta de spam.`
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

        <button type="submit" disabled={loading} className="register-button">
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
}