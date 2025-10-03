import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import "./PoleraEditor.css";
import { disenoMock } from "./disenoMock";

const PoleraEditor = () => {
  const canvasRef = useRef(null);
  const [vista, setVista] = useState("front");
  const [elementos, setElementos] = useState(disenoMock);

  const capturarImagen = () => {
    if (canvasRef.current) {
      html2canvas(canvasRef.current).then((canvas) => {
        const link = document.createElement("a");
        link.download = "polera.png";
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  const cambiarVista = (nuevaVista) => setVista(nuevaVista);

  const redimensionarElemento = (id, dw, dh) => {
    setElementos((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, width: el.width + dw, height: el.height + dh }
          : el
      )
    );
  };

  return (
    <div className="editor-container">
      <div className="vista-buttons">
        {["front", "back", "left", "right"].map((v) => (
          <button
            key={v}
            className={vista === v ? "active" : ""}
            onClick={() => cambiarVista(v)}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="canvas-wrapper" ref={canvasRef}>
        {elementos
          .filter((el) => el.vista === vista)
          .map((el) => (
            <div
              key={el.id}
              className="elemento"
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                backgroundImage: `url(${el.imagen})`,
              }}
            >
              <div
                className="resize-handle"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startY = e.clientY;

                  const onMouseMove = (eMove) => {
                    const dw = eMove.clientX - startX;
                    const dh = eMove.clientY - startY;
                    redimensionarElemento(el.id, dw, dh);
                  };

                  const onMouseUp = () => {
                    window.removeEventListener("mousemove", onMouseMove);
                    window.removeEventListener("mouseup", onMouseUp);
                  };

                  window.addEventListener("mousemove", onMouseMove);
                  window.addEventListener("mouseup", onMouseUp);
                }}
              />
            </div>
          ))}
      </div>

      <button className="capture-btn" onClick={capturarImagen}>
        Descargar Polera
      </button>
    </div>
  );
};

export default PoleraEditor;