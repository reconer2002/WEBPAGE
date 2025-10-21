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
          onVerified?.();
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
      {status !== "checking" && (
        <div style={{ marginTop: 12 }}>
          <p>{message}</p>
          <button className="btn primary" onClick={() => navigate("/")}>Ir al inicio</button>
        </div>
      )}
    </div>
  );
}

