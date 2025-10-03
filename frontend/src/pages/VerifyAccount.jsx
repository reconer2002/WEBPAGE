import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import authService from "../services/authService";
import "./VerifyAccount.css";

const VerifyAccount = ({ onVerified }) => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verificando tu cuenta...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token inválido. Verifica el enlace enviado a tu correo.");
      return;
    }

    const verify = async () => {
      setStatus("loading");
      const response = await authService.verifyEmail(token);
      if (response.success) {
        setStatus("success");
        setMessage(response.message);
        try {
          const current = await authService.getCurrentUser();
          if (current) {
            onVerified?.(current);
          }
        } catch (err) {
          console.warn("No se pudo refrescar el usuario tras verificar", err);
        }
      } else {
        setStatus("error");
        setMessage(response.message);
      }
    };

    verify();
  }, [searchParams, onVerified]);

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h2>Validación de cuenta</h2>
        <p className={`verify-message ${status}`}>{message}</p>
        <div className="verify-actions">
          {status === "success" ? (
            <Link to="/perfil" className="verify-btn primary">
              Ir a mi perfil
            </Link>
          ) : (
            <Link to="/" className="verify-btn secondary">
              Volver al inicio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;
