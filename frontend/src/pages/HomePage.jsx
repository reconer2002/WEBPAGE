// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Main/Header";
import Footer from "../components/Main/Footer";
import paginaService from "../services/paginaService";
import MainSlider from "../components/Main/MainSlider"; // importamos el slider
import TestimoniosView from "../components/Main/TestimoniosView"; // importamos testimonios

const HomePage = ({ user, onLogin, onLogout }) => {
  const [footerData, setFooterData] = useState({
    logo: "",
    telefono1: "",
    telefono2: "",
    correo_contacto: "",
    direccion: "",
    instagram_url: "",
  });

  useEffect(() => {
    const fetchFooter = async () => {
      const data = await paginaService.getFooterData();
      setFooterData(data);
    };
    fetchFooter();
  }, []);

  return (
    <div className="homepage-container">
      {/* Header con usuario */}
      <Header user={user} onLogin={onLogin} onLogout={onLogout} />

      {/* Contenido principal de la Home */}
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>¡Bienvenido a la página principal!</h1>
      </main>

      {/* Slider principal */}
      <MainSlider />

      {/* Sección de testimonios */}
      <TestimoniosView />

      {/* Footer */}
      <Footer
        logo={footerData.logo}
        telefono1={footerData.telefono1}
        telefono2={footerData.telefono2}
        correo_contacto={footerData.correo_contacto}
        direccion={footerData.direccion}
        instagram_url={footerData.instagram_url}
      />
    </div>
  );
};

export default HomePage;