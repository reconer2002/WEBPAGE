import React, { useEffect, useMemo, useState } from "react";
import authService from "../services/authService";
import "./Profile.css";

const REGIONES = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
];

const initialState = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  region: "",
};

const ProfilePage = ({ user, onUserUpdate }) => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [verificado, setVerificado] = useState(false);
  const [verificationExpiry, setVerificationExpiry] = useState(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [passwordData, setPasswordData] = useState({
    passwordActual: "",
    passwordNueva: "",
    confirmar: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passFeedback, setPassFeedback] = useState(null);
  const [passError, setPassError] = useState(null);

  const formattedExpiry = useMemo(() => {
    if (!verificationExpiry) return null;
    try {
      const date = new Date(verificationExpiry);
      return isNaN(date.getTime()) ? null : date.toLocaleString();
    } catch (e) {
      return null;
    }
  }, [verificationExpiry]);

  const applyProfile = (profile) => {
    if (!profile) return;
    setFormData({
      nombre: profile.nombre || "",
      apellido: profile.apellido || "",
      email: profile.email || "",
      telefono: profile.telefono || "",
      direccion: profile.direccion || "",
      ciudad: profile.ciudad || "",
      region: profile.region || "",
    });
    setVerificado(Boolean(profile.verificado));
    setVerificationExpiry(profile.verificacion_expira || null);
  };

  const loadProfile = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const current = await authService.getCurrentUser();
      if (current) {
        applyProfile(current);
        onUserUpdate?.(current);
      }
    } catch (err) {
      console.error("Error cargando perfil", err);
      setError("No se pudo cargar tu información. Intenta nuevamente.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user) {
      applyProfile(user);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    const response = await authService.updateProfile(formData);
    if (response.success) {
      setFeedback(response.message);
      await loadProfile(true);
    } else {
      setError(response.message);
    }
    setSaving(false);
  };

  const handleSendVerification = async () => {
    setSendingVerification(true);
    setFeedback(null);
    setError(null);
    const response = await authService.sendVerificationEmail();
    if (response.success) {
      setFeedback(response.message);
      await loadProfile(true);
    } else {
      setError(response.message);
    }
    setSendingVerification(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPassError(null);
    setPassFeedback(null);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setPassFeedback(null);
    setPassError(null);

    const { passwordActual, passwordNueva, confirmar } = passwordData;
    if (!passwordActual || !passwordNueva || !confirmar) {
      setPassError("Completa todos los campos de contraseña.");
      setSavingPassword(false);
      return;
    }
    if (passwordNueva.length < 6) {
      setPassError("La nueva contraseña debe tener al menos 6 caracteres.");
      setSavingPassword(false);
      return;
    }
    if (passwordNueva !== confirmar) {
      setPassError("La confirmación no coincide.");
      setSavingPassword(false);
      return;
    }

    const response = await authService.changePassword(
      passwordActual,
      passwordNueva
    );
    if (response.success) {
      setPassFeedback(response.message);
      setPasswordData({ passwordActual: "", passwordNueva: "", confirmar: "" });
    } else {
      setPassError(response.message);
    }

    setSavingPassword(false);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p className="profile-loading">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">Mi perfil</h2>

        <div className="profile-status-block">
          <div className={`profile-status ${verificado ? "verified" : "pending"}`}>
            {verificado ? "Cuenta verificada" : "Cuenta pendiente de verificación"}
          </div>
          {!verificado && (
            <>
              <button
                type="button"
                className="profile-btn secondary"
                onClick={handleSendVerification}
                disabled={sendingVerification}
              >
                {sendingVerification ? "Enviando..." : "Enviar correo de verificación"}
              </button>
              {formattedExpiry && (
                <p className="profile-hint">
                  El enlace actual expira el {formattedExpiry}.
                </p>
              )}
            </>
          )}
        </div>

        {feedback && <div className="profile-alert success">{feedback}</div>}
        {error && <div className="profile-alert error">{error}</div>}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-section">
            <h3>Datos personales</h3>
            <div className="profile-grid">
              <label className="profile-field">
                <span>Nombre</span>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  disabled={saving}
                  required
                />
              </label>
              <label className="profile-field">
                <span>Apellido</span>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  disabled={saving}
                  required
                />
              </label>
              <label className="profile-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={saving}
                  required
                />
              </label>
              <label className="profile-field">
                <span>Teléfono</span>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={saving}
                />
              </label>
            </div>
          </div>

          <div className="profile-section">
            <h3>Dirección</h3>
            <div className="profile-grid">
              <label className="profile-field">
                <span>Dirección</span>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Opcional"
                />
              </label>
              <label className="profile-field">
                <span>Ciudad</span>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Opcional"
                />
              </label>
              <label className="profile-field">
                <span>Región</span>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Selecciona una región</option>
                  {REGIONES.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="profile-actions">
            <button type="submit" className="profile-btn primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>

        <form className="profile-form" onSubmit={handlePasswordSubmit}>
          <div className="profile-section">
            <h3>Cambiar contraseña</h3>
            {passFeedback && (
              <div className="profile-alert success">{passFeedback}</div>
            )}
            {passError && <div className="profile-alert error">{passError}</div>}
            <div className="profile-grid">
              <label className="profile-field">
                <span>Contraseña actual</span>
                <input
                  type="password"
                  name="passwordActual"
                  value={passwordData.passwordActual}
                  onChange={handlePasswordChange}
                  disabled={savingPassword}
                  autoComplete="current-password"
                  required
                />
              </label>
              <label className="profile-field">
                <span>Nueva contraseña</span>
                <input
                  type="password"
                  name="passwordNueva"
                  value={passwordData.passwordNueva}
                  onChange={handlePasswordChange}
                  disabled={savingPassword}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
              <label className="profile-field">
                <span>Confirmar nueva contraseña</span>
                <input
                  type="password"
                  name="confirmar"
                  value={passwordData.confirmar}
                  onChange={handlePasswordChange}
                  disabled={savingPassword}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
            </div>
          </div>
          <div className="profile-actions">
            <button
              type="submit"
              className="profile-btn primary"
              disabled={savingPassword}
            >
              {savingPassword ? "Guardando..." : "Guardar contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
