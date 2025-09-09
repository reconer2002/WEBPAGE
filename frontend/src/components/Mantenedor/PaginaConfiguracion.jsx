import React, { useState, useEffect } from "react";
import paginaService from "../../services/paginaService";
import "./PaginaConfiguracion.css";

const PaginaConfiguracion = () => {
  const [formData, setFormData] = useState({
    telefono1: "",
    telefono2: "",
    correo_contacto: "",
    direccion: "",
    instagram_url: "",
  });

  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const data = await paginaService.getFooterData();
      setFormData({
        telefono1: data.telefono1,
        telefono2: data.telefono2,
        correo_contacto: data.correo_contacto,
        direccion: data.direccion,
        instagram_url: data.instagram_url,
      });
      setLogoPreview(data.logo);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Actualizar datos generales
      await paginaService.updatePaginaData(formData);

      // Actualizar logo si hay archivo nuevo
      if (logoFile) {
        const newLogoUrl = await paginaService.updateLogo(logoFile);
        setLogoPreview(newLogoUrl);
      }

      setMessage("Configuración actualizada correctamente.");
    } catch (err) {
        console.log(err);
      setMessage("Error al actualizar la configuración.", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pagina-configuracion">
      <h2>Configuración de la Página</h2>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group logo-group">
          <label>Logo actual</label>
          {logoPreview && <img src={logoPreview} alt="Logo" className="logo-preview" />}
          <input type="file" accept="image/*" onChange={handleLogoChange} />
        </div>

        <div className="form-group">
          <label>Teléfono 1</label>
          <input name="telefono1" value={formData.telefono1} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Teléfono 2</label>
          <input name="telefono2" value={formData.telefono2} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Correo de contacto</label>
          <input name="correo_contacto" value={formData.correo_contacto} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input name="direccion" value={formData.direccion} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Instagram URL</label>
          <input name="instagram_url" value={formData.instagram_url} onChange={handleChange} />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
};

export default PaginaConfiguracion;