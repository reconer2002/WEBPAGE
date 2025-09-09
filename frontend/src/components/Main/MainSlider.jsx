// src/components/Main/MainSlider.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MainSlider.css";

const slides = [
  { img: "/src/assets/Slide1.png", link: "/pagina1" },
  { img: "/src/assets/Slide2.jpg", link: "/pagina2" },
  { img: "/src/assets/Slide3.png", link: "/pagina3" },
];

const MainSlider = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const handleClick = (link) => {
    navigate(link);
  };

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
            key={index}
            className="slide"
            onClick={() => handleClick(slide.link)}
            style={{ backgroundImage: `url(${slide.img})` }}
          />
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