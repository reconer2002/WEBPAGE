// src/components/Main/MainSlider.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MainSlider.css";

// Importar las imágenes
import Slide1 from "../../assets/Slide1.png";
import Slide2 from "../../assets/Slide2.jpg";
import Slide3 from "../../assets/Slide3.png";

const MainSlider = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  // Slides estáticos del frontend
  const slides = [
    { id: 1, img: Slide1, link: "/buscar", alt: "Slide 1" },
    { id: 2, img: Slide2, link: "/buscar", alt: "Slide 2" },
    { id: 3, img: Slide3, link: "/buscar", alt: "Slide 3" },
  ];

  // Auto-avance del slider cada 7 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="main-slider">
      {/* Botón izquierdo */}
      <button className="slider-btn prev" onClick={prevSlide}>
        &#10094;
      </button>

      {/* Contenedor de slides */}
      <div
        className="slides-container"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="slide"
          >
            <img 
              src={slide.img} 
              alt={slide.alt}
              className="slide-image"
            />
          </div>
        ))}
      </div>

      {/* Botón derecho */}
      <button className="slider-btn next" onClick={nextSlide}>
        &#10095;
      </button>

      {/* Dots */}
      <div className="slider-dots">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={`dot ${current === idx ? "active" : ""}`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default MainSlider;