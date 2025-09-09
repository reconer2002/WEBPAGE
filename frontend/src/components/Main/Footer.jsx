import React, { useEffect, useState } from "react";
import paginaService from "../../services/paginaService";
import "./Footer.css";

const Footer = () => {
  const [footerData, setFooterData] = useState({
    logo: "",
    telefono1: "",
    telefono2: "",
    correo_contacto: "",
    direccion: "",
    instagram_url: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const data = await paginaService.getFooterData();
      setFooterData(data);
    };
    fetchData();
  }, []);

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Logo */}
        <div className="footer-logo">
          {footerData.logo ? (
            <img src={footerData.logo} alt="Logo" />
          ) : (
            <span className="logo-placeholder">Logo</span>
          )}
        </div>

        {/* Contacto */}
        <div className="footer-contact">
          <h4>Contacto</h4>
          {footerData.telefono1 && <p>Tel: {footerData.telefono1}</p>}
          {footerData.telefono2 && <p>Tel: {footerData.telefono2}</p>}
          {footerData.correo_contacto && (
            <p>Email: {footerData.correo_contacto}</p>
          )}
          {footerData.direccion && <p>Dirección: {footerData.direccion}</p>}
        </div>

        {/* Redes sociales */}
        <div className="footer-socials">
          <h4>Síguenos</h4>
          {footerData.instagram_url && (
            <a
              href={footerData.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-instagram"></i>
            </a>
          )}
        </div>

        {/* Enlaces legales */}
        <div className="footer-links">
          <a href="#">Términos y condiciones</a>
          <a href="#">Política de privacidad</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Mentes Creativas Store. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;