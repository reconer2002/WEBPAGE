import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import "./Register.css";

export default function Register({ onRegister }) {
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", password: "", telefono: "", direccion: "", ciudad: "", region: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError(null);
    setOk(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await authService.register({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        telefono: form.telefono,
        direccion: form.direccion,
        ciudad: form.ciudad,
        region: form.region,
      });
      if (res.success) {
        setOk(res.message || "Registro exitoso");
        onRegister?.(res.user || null);
        // Redirigir a pantalla de espera de verificación mostrando el email
        navigate('/verify-pending', { state: { email: form.email } });
      } else {
        setError(res.message || "No se pudo registrar");
      }
    } catch (err) {
      setError(err?.message || "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  };

  const REGIONES = [
    "Arica y Parinacota","Tarapacá","Antofagasta","Atacama","Coquimbo","Valparaíso","Metropolitana","O'Higgins","Maule","Ñuble","Biobío","La Araucanía","Los Ríos","Los Lagos","Aysén","Magallanes"
  ];

  return (
    <div className="register-container">
      <h2>Crear Cuenta</h2>
      <form onSubmit={onSubmit} className="register-form">
        <div className="register-row">
        <label className="register-field">
          Nombre
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            required
            placeholder="Tu nombre"
            className="register-input"
          />
        </label>
        <label className="register-field">
          Apellido
          <input
            name="apellido"
            value={form.apellido}
            onChange={onChange}
            placeholder="Tu apellido"
            className="register-input"
          />
        </label>
        </div>

        <div className="register-row">
        <label className="register-field">
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            placeholder="tu@correo.cl"
            className="register-input"
          />
        </label>
        <label className="register-field">
          Teléfono
          <input
            name="telefono"
            value={form.telefono}
            onChange={onChange}
            placeholder="+56 9..."
            className="register-input"
          />
        </label>
        </div>

        <label className="register-field register-full">
          Contraseña
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            minLength={6}
            required
            placeholder="Mínimo 6 caracteres"
            className="register-input"
          />
        </label>
        <label className="register-field register-full">
          Dirección
          <input
            name="direccion"
            value={form.direccion}
            onChange={onChange}
            placeholder="Calle 123"
            className="register-input"
          />
        </label>
        <div className="register-row">
          <label className="register-field">
          Ciudad
          <input
            name="ciudad"
            value={form.ciudad}
            onChange={onChange}
            placeholder="Ciudad"
            className="register-input"
          />
        </label>
        <label className="register-field">
          Región
          <select
            name="region"
            value={form.region}
            onChange={onChange}
            className="register-input"
          >
            <option value="">Selecciona una región</option>
            {REGIONES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        </div>
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
      {error && (
        <div style={{ marginTop: 12, color: "#c62828" }}>{error}</div>
      )}
      {ok && <div style={{ marginTop: 12, color: "#2e7d32" }}>{ok}</div>}
    </div>
  );
}
