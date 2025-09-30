import React, { useEffect, useRef, useState } from "react";
import html2canvas from 'html2canvas';
import logo from './img/Logo.png'; // Importa el logo

// Importa cada parte de las imágenes
import camisetaFrenteCuello from './img/polera_base.png';
import camisetaFrenteTorso from './img/polera_base.png';
import camisetaFrenteMangas from './img/polera_base.png';

import camisetaIzquierdaTorsoFrente from './img/polera_base.png';
import camisetaIzquierdaTorsoEspalda from './img/polera_base.png';
import camisetaIzquierdaManga from './img/polera_base.png';
import camisetaIzquierdaCuello from './img/polera_base.png';

import camisetaEspaldaTorso from './img/polera_base.png';
import camisetaEspaldaMangas from './img/polera_base.png';
import camisetaEspaldaCuello from './img/polera_base.png';

import camisetaDerechaTorsoFrente from './img/polera_base.png';
import camisetaDerechaTorsoEspalda from './img/polera_base.png';
import camisetaDerechaManga from './img/polera_base.png';
import camisetaDerechaCuello from './img/polera_base.png';
import axios from "axios";
const Custom = () => {
  const [activeSection, setActiveSection] = useState("modelos");
  const [selectedModel, setSelectedModel] = useState("modelo1");
  const [shirtName, setShirtName] = useState("");
  const [shirtNumber, setShirtNumber] = useState("");
  const [shirtColors, setShirtColors] = useState({
    torso: "#dc2626",
    mangas: "#dc2626",
    cuello: "#dc2626"
  });
  const [shirtSize, setShirtSize] = useState("M");
  const [comments, setComments] = useState([
    {
      text: "Excelente herramienta de personalización, muy fácil de usar.",
      rating: 5,
      author: "Juan Pérez"
    },
    {
      text: "Me encanta poder ver la vista previa en tiempo real.",
      rating: 4,
      author: "María López"
    }
  ]);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [selectedView, setSelectedView] = useState("frente");
  const [shirtLogos, setShirtLogos] = useState({
    frente: [],
    espalda: [],
    izquierda: [],
    derecha: []
  });
  const [positions, setPositions] = useState({
    frente: { name: { x: 50, y: 10 }, number: { x: 50, y: 50 }, logos: [] },
    espalda: { name: { x: 50, y: 10 }, number: { x: 50, y: 50 }, logos: [] },
    izquierda: { name: { x: 50, y: 10 }, number: { x: 50, y: 50 }, logos: [] },
    derecha: { name: { x: 50, y: 10 }, number: { x: 50, y: 50 }, logos: [] }
  });
  const [dragging, setDragging] = useState({ type: null, view: null, index: null });
  const [imageError, setImageError] = useState(null);
  const [diseñoSubidoExito, setDiseñoSubidoExito] = useState('');

  const nameRef = useRef(null);
  const numberRef = useRef(null);
  const logoRefs = useRef([]);

  const canvasRefs = {
    torso1: useRef(null),
    torso2: useRef(null),
    mangas: useRef(null),
    cuello: useRef(null)
  };

  const modelos = Array.from({ length: 12 }, (_, i) => ({
    id: `modelo${i + 1}`,
    name: `Modelo ${i + 1}`,
    price: `$${(25000 + i * 2000).toLocaleString()}`
  }));

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const averageRating = comments.length === 0 ? 0 : Math.round(comments.reduce((acc, c) => acc + c.rating, 0) / comments.length);

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const applyColorToCanvas = (canvas, color, imageSrc) => {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const { r, g, b } = hexToRgb(color);

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = r * (avg / 255);
        data[i + 1] = g * (avg / 255);
        data[i + 2] = b * (avg / 255);
      }

      ctx.putImageData(imageData, 0, 0);
    };
    img.onerror = () => {
      setImageError(`Error loading image: ${imageSrc}`);
      console.error(`Error loading image: ${imageSrc}`);
    };
    img.src = imageSrc;
  };

  const getShirtImages = () => {
    switch (selectedView) {
      case "frente":
        return {
          torso1: { ref: canvasRefs.torso1, color: shirtColors.torso, src: camisetaFrenteTorso },
          mangas: { ref: canvasRefs.mangas, color: shirtColors.mangas, src: camisetaFrenteMangas },
          cuello: { ref: canvasRefs.cuello, color: shirtColors.cuello, src: camisetaFrenteCuello }
        };
      case "derecha":
        return {
          torso1: { ref: canvasRefs.torso1, color: shirtColors.torso, src: camisetaDerechaTorsoFrente },
          torso2: { ref: canvasRefs.torso2, color: shirtColors.torso, src: camisetaDerechaTorsoEspalda },
          mangas: { ref: canvasRefs.mangas, color: shirtColors.mangas, src: camisetaDerechaManga },
          cuello: { ref: canvasRefs.cuello, color: shirtColors.cuello, src: camisetaDerechaCuello }
        };
      case "espalda":
        return {
          torso1: { ref: canvasRefs.torso1, color: shirtColors.torso, src: camisetaEspaldaTorso },
          mangas: { ref: canvasRefs.mangas, color: shirtColors.mangas, src: camisetaEspaldaMangas },
          cuello: { ref: canvasRefs.cuello, color: shirtColors.cuello, src: camisetaEspaldaCuello }
        };
      case "izquierda":
        return {
          torso1: { ref: canvasRefs.torso1, color: shirtColors.torso, src: camisetaIzquierdaTorsoFrente },
          torso2: { ref: canvasRefs.torso2, color: shirtColors.torso, src: camisetaIzquierdaTorsoEspalda },
          mangas: { ref: canvasRefs.mangas, color: shirtColors.mangas, src: camisetaIzquierdaManga },
          cuello: { ref: canvasRefs.cuello, color: shirtColors.cuello, src: camisetaIzquierdaCuello }
        };
      default:
        return {
          torso1: { ref: canvasRefs.torso1, color: shirtColors.torso, src: camisetaFrenteTorso },
          mangas: { ref: canvasRefs.mangas, color: shirtColors.mangas, src: camisetaFrenteMangas },
          cuello: { ref: canvasRefs.cuello, color: shirtColors.cuello, src: camisetaFrenteCuello }
        };
    }
  };

  useEffect(() => {
    const shirtImages = getShirtImages();
    Object.entries(shirtImages).forEach(([key, part]) => {
      if (part.ref.current) {
        applyColorToCanvas(part.ref.current, part.color, part.src);
      }
    });
  }, [shirtColors, selectedView]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    const commentText = e.target.comment.value.trim();
    const authorName = e.target.author.value.trim() || "Anónimo";

    // Validación
    if (!commentText || newRating <= 0) {
      setError("Comentario y calificación son obligatorios");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/comments", {
        comentario: commentText,
        usuario: authorName
      });

      const savedComment = response.data;

      // Adaptar estructura para el frontend
      const newComment = {
        id: savedComment._id,
        text: commentText,
        rating: newRating,
        author: savedComment.usuario?.nombre || authorName,
        date: savedComment.fecha,
      };

      setComments([...comments, newComment]);
      setError("");
      setMensajeExito("Comentario agregado correctamente"); // Si quieres usarlo como en el otro handle

      // Limpiar campos
      e.target.comment.value = "";
      e.target.author.value = "";
      setNewRating(0);
    } catch (error) {
      setError(error.response?.data?.error || "Error al agregar el comentario.");
    }

    console.log("Comentario agregado:", commentText, authorName, newRating);
  };

  const handleRatingClick = (value) => {
    setNewRating(value);
  };

  const handleLogoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newLogos = files.map((file) => ({
      id: Date.now() + Math.random(),
      url: URL.createObjectURL(file),
      position: { x: 50, y: 50 },
      size: { width: 100, height: 100 }
    }));

    setShirtLogos({
      ...shirtLogos,
      [selectedView]: [...shirtLogos[selectedView], ...newLogos],
    });

    setPositions({
      ...positions,
      [selectedView]: {
        ...positions[selectedView],
        logos: [...positions[selectedView].logos, ...newLogos.map(logo => logo.position)]
      }
    });
  };

  const handleRemoveLogo = (index) => {
    const updatedLogos = [...shirtLogos[selectedView]];
    updatedLogos.splice(index, 1);
    setShirtLogos({
      ...shirtLogos,
      [selectedView]: updatedLogos,
    });

    const updatedPositions = [...positions[selectedView].logos];
    updatedPositions.splice(index, 1);
    setPositions({
      ...positions,
      [selectedView]: {
        ...positions[selectedView],
        logos: updatedPositions
      }
    });
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value) && value.length <= 20) {
      setShirtName(value);
    }
  };

  const handleNumberChange = (e) => {
    const value = e.target.value;
    const num = parseInt(value, 10);
    if (value === "" || (num >= 1 && num <= 99)) {
      setShirtNumber(value);
    }
  };

  const handleSizeChange = (index, dimension, value) => {
    const updatedLogos = [...shirtLogos[selectedView]];
    updatedLogos[index].size[dimension] = value;
    setShirtLogos({
      ...shirtLogos,
      [selectedView]: updatedLogos,
    });
  };

  const renderStars = (rating, clickable = false, onClickFn) => {
    return [...Array(5)].map((_, i) => {
      const starValue = i + 1;
      return (
        <span
          key={i}
          className={`star ${starValue <= rating ? "filled" : ""}`}
          onClick={() => clickable && onClickFn(starValue)}
          style={{ cursor: clickable ? "pointer" : "default" }}
        >
          ★
        </span>
      );
    });
  };

const handleSaveDesign = async () => {
  // 1. Guardar el diseño como lo hacías antes
  const design = {
    model: selectedModel,
    name: shirtName,
    number: shirtNumber,
    colors: shirtColors,
    size: shirtSize,
    logos: shirtLogos,
    positions
  };

  console.log("Diseño guardado:", design);
  setDiseñoSubidoExito('¡Diseño guardado con éxito, favor enviar a Deporteskuden@gmail.com!');

  // 2. Capturar y descargar imagen
  const preview = document.querySelector(".shirt-preview");
  if (!preview) {
    alert("No se encontró la vista previa de la camiseta.");
    return;
  }

  const canvas = await html2canvas(preview);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "mi_camiseta.png";
  link.click();
};


  const handleMouseDown = (e, type, index) => {
    setDragging({ type, view: selectedView, index });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (dragging.type === 'logo') {
      const updatedPositions = [...positions[dragging.view].logos];
      updatedPositions[dragging.index] = { x, y };
      setPositions({
        ...positions,
        [dragging.view]: {
          ...positions[dragging.view],
          logos: updatedPositions
        }
      });
    } else {
      setPositions(prevPositions => ({
        ...prevPositions,
        [dragging.view]: {
          ...prevPositions[dragging.view],
          [dragging.type]: { x, y }
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setDragging({ type: null, view: null, index: null });
  };

  const captureAndUploadViews = async () => {
    const views = ["frente", "espalda", "izquierda", "derecha"];
    const capturedImages = [];

    for (const view of views) {
      setSelectedView(view);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(document.querySelector('.shirt-preview'));
      const dataURL = canvas.toDataURL('image/png');
      capturedImages.push({ view, dataURL });
    }

    setDiseñoSubidoExito('¡Diseño subido con éxito!');
    console.log("Capturas de vistas:", capturedImages);
  };

  return (
    <div className="container">
      <style jsx>{`
        canvas {
          width: 100%;
          height: auto;
          max-width: 400px;
          max-height: 400px;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Arial', sans-serif;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #ffffff;
          line-height: 1.6;
        }

        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        }

       /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 2px solid #666;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          width: 100vw;
          margin-left: calc(-50vw + 50%);
        }

        .logo {
          height: 45px;
          width: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logo:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        }

        .nav {
          display: flex;
          gap: 30px;
          align-items: center;
        }

        .nav-link {
          color: #ffffff;
          text-decoration: none;
          font-weight: 500;
          padding: 10px 15px;
          border-radius: 6px;
          position: relative;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .nav-link:hover, .nav-link.active {
          color: #888;
          border-color: #888;
          background: rgba(136, 136, 136, 0.1);
        }

        .dropdown {
          position: relative;
        }

        .dropbtn {
          background: transparent;
          border: 1px solid transparent;
          color: #ffffff;
          padding: 10px 15px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .dropbtn:hover {
          color: #888;
          border-color: #888;
          background: rgba(136, 136, 136, 0.1);
        }

        .dropdown-content {
          display: none;
          position: absolute;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(10px);
          min-width: 200px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          border: 1px solid #666;
          top: 100%;
          left: 0;
          z-index: 1000;
        }

        .dropdown:hover .dropdown-content {
          display: block;
        }

        .dropdown-content a {
          color: #ffffff;
          padding: 12px 16px;
          text-decoration: none;
          display: block;
          transition: all 0.3s ease;
        }

        .dropdown-content a:hover {
          background: rgba(136, 136, 136, 0.2);
          color: #888;
        }

        .boton-nav-rojo {
          background: linear-gradient(45deg, #dc2626, #ef4444);
          color: white !important;
          border: none !important;
        }

        .boton-nav-rojo:hover {
          background: linear-gradient(45deg, #b91c1c, #dc2626);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-icon {
          background: linear-gradient(45deg, #dc2626, #ef4444);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .user-icon:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        }

        .logout-btn {
          background: rgba(136, 136, 136, 0.2);
          color: #888;
          border: 1px solid #888;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .logout-btn:hover {
          background: rgba(136, 136, 136, 0.3);
          transform: translateY(-1px);
        }

        .custom-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 20px;
          flex: 1;
        }

        .page-header {
          text-align: center;
          margin-bottom: 50px;
          padding: 40px 0;
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }

        .page-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="%23dc2626" opacity="0.1"/></svg>');
          background-size: 50px 50px;
          z-index: 0;
        }

        .page-header h1 {
          font-size: 3rem;
          margin-bottom: 15px;
          background: linear-gradient(45deg, #ffffff, #888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
          z-index: 1;
        }

        .page-header p {
          font-size: 1.2rem;
          color: #cccccc;
          position: relative;
          z-index: 1;
        }

        .custom-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 40px;
          margin-bottom: 50px;
        }

        .shirt-display-container {
          background: rgba(26, 26, 26, 0.8);
          border-radius: 20px;
          padding: 30px;
          border: 1px solid rgba(136, 136, 136, 0.2);
          backdrop-filter: blur(10px);
        }

        .view-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          justify-content: center;
        }

        .view-btn {
          background: rgba(136, 136, 136, 0.2);
          color: #cccccc;
          border: 1px solid #666;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .view-btn.active {
          background: linear-gradient(45deg, #dc2626, #ef4444);
          color: white;
          border-color: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        }

        .shirt-preview {
          width: 100%;
          height: 400px;
          background: transparent;
          border-radius: 15px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: none;
          overflow: visible;
          transition: all 0.3s ease;
        }

        .shirt-part {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: transparent;
        }

        .shirt-name, .shirt-number, .shirt-logo {
          position: absolute;
          cursor: move;
          user-select: none;
          transform: translate(-50%, -50%);
          z-index: 10;
        }

        .shirt-name {
          font-size: 1.3rem;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .shirt-number {
          font-size: 4rem;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .shirt-logo {
          max-width: 80px;
          max-height: 80px;
          border-radius: 8px;
        }

        .custom-panel {
          background: rgba(26, 26, 26, 0.8);
          border-radius: 20px;
          padding: 30px;
          border: 1px solid rgba(136, 136, 136, 0.2);
          backdrop-filter: blur(10px);
          height: fit-content;
        }

        .section-nav {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 30px;
        }

        .section-btn {
          background: rgba(136, 136, 136, 0.2);
          color: #cccccc;
          border: 1px solid #666;
          padding: 15px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          text-align: left;
        }

        .section-btn.active {
          background: linear-gradient(45deg, #dc2626, #ef4444);
          color: white;
          border-color: #dc2626;
          transform: translateX(5px);
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        }

        .section-content {
          min-height: 300px;
        }

        .models-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 10px;
        }

        .models-grid::-webkit-scrollbar {
          width: 6px;
        }

        .models-grid::-webkit-scrollbar-track {
          background: rgba(136, 136, 136, 0.1);
          border-radius: 3px;
        }

        .models-grid::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        .model-card {
          background: rgba(136, 136, 136, 0.1);
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .model-card.selected {
          border-color: #dc2626;
          background: rgba(220, 38, 38, 0.2);
          transform: scale(1.05);
        }

        .model-card:hover {
          border-color: #888;
          transform: translateY(-2px);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          color: #888;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .form-input {
          width: 100%;
          padding: 12px 15px;
          background: rgba(136, 136, 136, 0.1);
          border: 1px solid #666;
          border-radius: 8px;
          color: #ffffff;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #dc2626;
          box-shadow: 0 0 10px rgba(220, 38, 38, 0.3);
        }

        .form-input::placeholder {
          color: #999;
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .color-option {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.3s ease;
          position: relative;
        }

        .color-option.selected {
          border-color: #ffffff;
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
        }

        .size-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .size-option {
          padding: 12px;
          background: rgba(136, 136, 136, 0.1);
          border: 2px solid #666;
          border-radius: 8px;
          color: #cccccc;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          font-weight: 500;
        }

        .size-option.selected {
          border-color: #dc2626;
          background: rgba(220, 38, 38, 0.2);
          color: white;
        }

        .upload-area {
          border: 2px dashed #666;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          background: rgba(136, 136, 136, 0.05);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .upload-area:hover {
          border-color: #dc2626;
          background: rgba(220, 38, 38, 0.1);
        }

        .upload-area input {
          display: none;
        }

        .uploaded-images {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .uploaded-image-container {
          position: relative;
          display: inline-block;
        }

        .uploaded-image {
          width: 100%;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
        }

        .remove-image {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
        }

        .size-controls {
          display: flex;
          flex-direction: column;
          margin-top: 10px;
        }

        .size-controls label {
          margin-bottom: 5px;
          font-size: 0.8rem;
        }

        .size-slider {
          width: 100%;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          margin-top: 30px;
        }

        .btn-primary {
          background: linear-gradient(45deg, #dc2626, #ef4444);
          color: white;
          border: none;
          padding: 8px 16px; /* Ajustado para ser más pequeño */
          border-radius: 8px;
          font-size: 0.9rem; /* Tamaño de fuente reducido */
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
        }

        .btn-secondary {
          background: rgba(136, 136, 136, 0.2);
          color: #888;
          border: 1px solid #888;
          padding: 8px 16px; /* Ajustado para ser más pequeño */
          border-radius: 8px;
          font-size: 0.9rem; /* Tamaño de fuente reducido */
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
        }

        .btn-secondary:hover {
          background: rgba(136, 136, 136, 0.3);
          transform: translateY(-2px);
        }

        .reviews-section {
          background: rgba(26, 26, 26, 0.8);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(136, 136, 136, 0.2);
          backdrop-filter: blur(10px);
          margin-bottom: 40px;
        }

        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .reviews-header h3 {
          font-size: 1.8rem;
          color: #888;
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .star {
          color: #666;
          font-size: 1.5rem;
          transition: color 0.3s ease;
        }

        .star.filled {
          color: #ffd700;
        }

        .star:hover {
          color: #ffd700;
        }

        .comment-form {
          display: grid;
          gap: 20px;
          margin-bottom: 30px;
          padding: 30px;
          background: rgba(136, 136, 136, 0.1);
          border-radius: 15px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 20px;
        }

        .textarea {
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }

        .rating-input {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .comment {
          background: rgba(136, 136, 136, 0.1);
          padding: 25px;
          border-radius: 15px;
          border-left: 4px solid #dc2626;
        }

        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .comment-author {
          font-weight: bold;
          color: #888;
        }

        .comment-rating {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .comment-text {
          color: #cccccc;
          line-height: 1.6;
        }

        .footer {
          background: #0a0a0a;
          padding: 30px 40px;
          text-align: center;
          color: #666;
          border-top: 1px solid #333;
          margin-top: auto;
        }

        @media (max-width: 1200px) {
          .custom-layout {
            grid-template-columns: 1fr;
            gap: 30px;
          }
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 20px;
          }

          .nav {
            flex-wrap: wrap;
            gap: 15px;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .models-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>

      <header className="header">
                    <div className="logo">
                      <img src={logo} alt="Logo" style={{ height: '100%', width: 'auto' }} />
                    </div>
      
        <nav className="nav">
          <a href="/inicio" className="nav-link">Inicio</a>
          <a href="/productos" className="nav-link">Productos</a>
          <a href="/company" className="nav-link">Nuestra Compañía</a>
          <a href="/custom" className="nav-link active">Personalización</a>
          <a href="/bomberos" className="nav-link boton-nav-rojo">Bomberos Chile</a>
        </nav>
        <div className="user-menu">
          <div className="dropdown">
            <button className="dropbtn">Usuario ▼</button>
            <div className="dropdown-content">
              <a href="/">Iniciar Sesión</a>
              <a href="/register">Registrarse</a>
              <a href="/account">Mi Cuenta</a>
              <button className="logout-btn">Cerrar Sesión</button>
            </div>
          </div>
          <div className="user-icon">👤</div>
        </div>
      </header>

      <div className="custom-container">
        <div className="page-header">
          <h1>Personalización de Camisetas</h1>
          <p>Diseña tu camiseta perfecta con nuestro editor avanzado</p>
        </div>

        <div className="custom-layout">
          <div className="shirt-display-container">
            <div className="view-controls">
              {["frente", "espalda", "izquierda", "derecha"].map((view) => (
                <button
                  key={view}
                  className={`view-btn ${selectedView === view ? "active" : ""}`}
                  onClick={() => setSelectedView(view)}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
            {imageError && <p style={{ color: 'red' }}>{imageError}</p>}
            <div
              className="shirt-preview"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {shirtLogos[selectedView].map((logo, index) => (
                <div
                  key={logo.id}
                  style={{
                    position: 'absolute',
                    top: `${positions[selectedView].logos[index]?.y || 50}%`,
                    left: `${positions[selectedView].logos[index]?.x || 50}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    cursor: 'move'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'logo', index)}
                >
                  <img
                    src={logo.url}
                    alt="Logo"
                    style={{
                      width: `${logo.size.width}px`,
                      height: `${logo.size.height}px`,
                      borderRadius: '8px'
                    }}
                  />
                </div>
              ))}
              {Object.entries(getShirtImages()).map(([key, part]) => (
                <canvas
                  key={key}
                  ref={part.ref}
                  className="shirt-part"
                />
              ))}
              {selectedView === "espalda" && (
                <div
                  ref={nameRef}
                  className="shirt-name"
                  style={{ top: `${positions[selectedView].name.y}%`, left: `${positions[selectedView].name.x}%` }}
                  onMouseDown={(e) => handleMouseDown(e, 'name')}
                >
                  {shirtName || "Tu Nombre"}
                </div>
              )}
              {(selectedView === "frente" || selectedView === "espalda") && (
                <div
                  ref={numberRef}
                  className="shirt-number"
                  style={{ top: `${positions[selectedView].number.y}%`, left: `${positions[selectedView].number.x}%` }}
                  onMouseDown={(e) => handleMouseDown(e, 'number')}
                >
                  {shirtNumber || "99"}
                </div>
              )}
            </div>
            <div style={{ marginTop: "20px", textAlign: "center", color: "#888" }}>
              <p>Vista: {selectedView} | Modelo: {selectedModel} | Talla: {shirtSize}</p>
            </div>
          </div>

          <div className="custom-panel">
            <nav className="section-nav">
              <button
                className={`section-btn ${activeSection === "modelos" ? "active" : ""}`}
                onClick={() => setActiveSection("modelos")}
              >
                🎽 Modelos de Camiseta
              </button>
              <button
                className={`section-btn ${activeSection === "colores" ? "active" : ""}`}
                onClick={() => setActiveSection("colores")}
              >
                🎨 Colores
              </button>
              <button
                className={`section-btn ${activeSection === "tallas" ? "active" : ""}`}
                onClick={() => setActiveSection("tallas")}
              >
                📏 Tallas
              </button>
              <button
                className={`section-btn ${activeSection === "nombre" ? "active" : ""}`}
                onClick={() => setActiveSection("nombre")}
              >
                🆔 Nombre y Número
              </button>
              <button
                className={`section-btn ${activeSection === "estampados" ? "active" : ""}`}
                onClick={() => setActiveSection("estampados")}
              >
                🖼️ Estampados
              </button>
            </nav>

            <div className="section-content">
              {activeSection === "modelos" && (
                <div className="models-grid">
                  {modelos.map((modelo) => (
                    <div
                      key={modelo.id}
                      className={`model-card ${selectedModel === modelo.id ? "selected" : ""}`}
                      onClick={() => setSelectedModel(modelo.id)}
                    >
                      <p>{modelo.name}</p>
                      <p style={{ fontWeight: 'bold' }}>{modelo.price}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === "colores" && (
                <div>
                  <div className="form-group">
                    <label>Color del Torso:</label>
                    <input
                      type="color"
                      value={shirtColors.torso}
                      onChange={(e) => setShirtColors({...shirtColors, torso: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Color de las Mangas:</label>
                    <input
                      type="color"
                      value={shirtColors.mangas}
                      onChange={(e) => setShirtColors({...shirtColors, mangas: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Color del Cuello:</label>
                    <input
                      type="color"
                      value={shirtColors.cuello}
                      onChange={(e) => setShirtColors({...shirtColors, cuello: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {activeSection === "tallas" && (
                <div className="form-group">
                  <label>Selecciona una talla:</label>
                  <div className="size-grid">
                    {sizes.map((size) => (
                      <div
                        key={size}
                        className={`size-option ${shirtSize === size ? "selected" : ""}`}
                        onClick={() => setShirtSize(size)}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "nombre" && (
                <div>
                  <div className="form-group">
                    <label>Nombre:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nombre (máx. 20 caracteres)"
                      value={shirtName}
                      onChange={handleNameChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Número:</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Número (1-99)"
                      value={shirtNumber}
                      onChange={handleNumberChange}
                    />
                  </div>
                </div>
              )}

              {activeSection === "estampados" && (
                <div>
                  <div className="upload-area" onClick={() => document.getElementById('logo-upload').click()}>
                    <p>Haz clic para subir un estampado</p>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <div className="uploaded-images">
                    {shirtLogos[selectedView].map((logo, index) => (
                      <div key={logo.id} className="uploaded-image-container">
                        <img src={logo.url} alt={`Logo ${index}`} className="uploaded-image" style={{ width: '80px', height: '80px' }} />
                        <div className="remove-image" onClick={() => handleRemoveLogo(index)}>X</div>
                        <div className="size-controls">
                          <label>Ancho: {logo.size.width}px</label>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={logo.size.width}
                            onChange={(e) => handleSizeChange(index, 'width', parseInt(e.target.value))}
                          />
                          <label>Alto: {logo.size.height}px</label>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={logo.size.height}
                            onChange={(e) => handleSizeChange(index, 'height', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={() => {}}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveDesign}>Guardar Diseño</button>
              <button className="btn-primary" onClick={captureAndUploadViews}>Subir Diseño</button>
            </div>
            {diseñoSubidoExito && <p className="success-message">{diseñoSubidoExito}</p>}
          </div>
        </div>

        <div className="reviews-section">
          <div className="reviews-header">
            <h3>Reseñas</h3>
            <div className="rating-display">
              {renderStars(averageRating)}
              <span>{averageRating}/5</span>
            </div>
          </div>

          <form className="comment-form" onSubmit={handleAddComment}>
            <div className="form-row">
              <textarea
                name="comment"
                className="form-input textarea"
                placeholder="Deja un comentario..."
                required
              ></textarea>
              <div>
                <div className="form-group">
                  <label>Tu Nombre:</label>
                  <input
                    name="author"
                    type="text"
                    className="form-input"
                    placeholder="Nombre (opcional)"
                  />
                </div>
                <div className="form-group">
                  <label>Calificación:</label>
                  <div className="rating-input">
                    {renderStars(newRating, true, handleRatingClick)}
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={newRating === 0}>
              Agregar Comentario
            </button>
          </form>

          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <div key={index} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <div className="comment-rating">
                      {renderStars(comment.rating)}
                    </div>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))
            ) : (
              <p>No hay comentarios aún.</p>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© 2025 Deportes Kuden. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Custom;
