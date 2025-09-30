import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Text, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import "./HerramientaDiseño.css";
import { obtenerArticuloPorId } from "../../services/diseñoMockService";
import ImagenElemento from "./ImagenElemento";

const HerramientaDiseño = () => {
  const [articulo, setArticulo] = useState(null);
  const [canvasWidth] = useState(400);
  const [canvasHeight] = useState(500);
  const [elementos, setElementos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const stageRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const [textInputValue, setTextInputValue] = useState("");
  const [textStyle, setTextStyle] = useState({
    fontSize: 20,
    fill: "#000000",
    fontFamily: "Arial",
    fontStyle: "normal",
  });
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });

  const [baseImage] = useImage(articulo?.imagenBase || "");

  // Obtener artículo
  useEffect(() => {
    const fetchArticulo = async () => {
      const art = await obtenerArticuloPorId(1);
      setArticulo(art);
    };
    fetchArticulo();
  }, []);

  // Cerrar edición si clic fuera del input y viñeta
  useEffect(() => {
    const handleClickOutside = (e) => {
      const input = inputRef.current;
      const panel = panelRef.current;
      if (selectedId && input && panel && !input.contains(e.target) && !panel.contains(e.target)) {
        setSelectedId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedId]);

  const agregarTexto = () => {
    const nuevoTexto = {
      id: Date.now(),
      type: "text",
      x: 50,
      y: 50,
      text: "Texto",
      fontSize: 20,
      fill: "#000000",
      fontFamily: "Arial",
      fontStyle: "normal",
      rotation: 0,
      scale: 1,
    };
    setElementos([...elementos, nuevoTexto]);
  };

  const agregarImagen = (url) => {
    const nuevaImagen = {
      id: Date.now(),
      type: "image",
      x: 50,
      y: 50,
      url,
      width: 100,
      height: 100,
      rotation: 0,
    };
    setElementos([...elementos, nuevaImagen]);
  };

  const actualizarElemento = (id, cambios) => {
    setElementos((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...cambios } : el))
    );
  };

  const handleSelectText = (el) => {
    setSelectedId(el.id);
    setTextInputValue(el.text);
    setTextStyle({
      fontSize: el.fontSize,
      fill: el.fill,
      fontFamily: el.fontFamily || "Arial",
      fontStyle: el.fontStyle || "normal",
      rotation: el.rotation || 0,
      scale: el.scale || 1,
    });

    const stage = stageRef.current.getStage();
    const node = stage.findOne(`#text-${el.id}`);
    const absPos = node.getClientRect();
    setPanelPosition({
      top: absPos.y + stage.container().offsetTop + "px",
      left: absPos.x + stage.container().offsetLeft + absPos.width + 10 + "px",
    });

    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleTextInputChange = (e) => {
    setTextInputValue(e.target.value);
    actualizarElemento(selectedId, { text: e.target.value });
  };

  return (
    <div className="herramienta-diseño-container" style={{ position: "relative" }}>
      <div className="herramienta-diseño-sidebar">
        <button onClick={agregarTexto}>Agregar texto</button>
        <button onClick={() => agregarImagen("/img/logo.png")}>Agregar imagen</button>
      </div>

      <div className="herramienta-diseño-canvas">
        <Stage
          width={canvasWidth}
          height={canvasHeight}
          ref={stageRef}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
            }
          }}
        >
          <Layer>
            {baseImage && (
              <KonvaImage image={baseImage} width={canvasWidth} height={canvasHeight} />
            )}

            {elementos.map((el) => {
              if (el.type === "text") {
                const isSelected = el.id === selectedId;
                return (
                  <React.Fragment key={el.id}>
                    <Text
                      id={`text-${el.id}`}
                      x={el.x}
                      y={el.y}
                      text={el.text}
                      fontSize={el.fontSize}
                      fill={el.fill}
                      fontFamily={el.fontFamily || "Arial"}
                      fontStyle={el.fontStyle || "normal"}
                      rotation={el.rotation || 0}
                      scale={{ x: el.scale || 1, y: el.scale || 1 }}
                      draggable
                      onDragEnd={(e) => {
                        actualizarElemento(el.id, { x: e.target.x(), y: e.target.y() });
                        if (isSelected) {
                          setPanelPosition({
                            top: e.target.y() + stageRef.current.container().offsetTop + "px",
                            left: e.target.x() + e.target.width() * (el.scale || 1) + 10 + "px",
                          });
                        }
                      }}
                      onDblClick={() => handleSelectText(el)}
                      onClick={() => handleSelectText(el)}
                    />
                    {isSelected && <Transformer rotateEnabled={true} />}
                  </React.Fragment>
                );
              } else if (el.type === "image") {
                return <ImagenElemento key={el.id} el={el} onUpdate={actualizarElemento} />;
              }
              return null;
            })}
          </Layer>
        </Stage>

        {selectedId && (
          <>
            <input
              ref={inputRef}
              style={{
                position: "absolute",
                top: panelPosition.top,
                left: panelPosition.left,
                width: "100px",
                fontSize: textStyle.fontSize + "px",
                color: textStyle.fill,
                border: "1px solid #ccc",
                padding: "2px",
              }}
              value={textInputValue}
              onChange={handleTextInputChange}
              autoFocus
            />

            <div
              ref={panelRef}
              className="text-style-panel-bubble"
              style={{
                position: "absolute",
                top: panelPosition.top,
                left: parseInt(panelPosition.left) + 120 + "px",
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                zIndex: 10,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <label>
                Color:
                <input
                  type="color"
                  value={textStyle.fill}
                  onChange={(e) => {
                    setTextStyle({ ...textStyle, fill: e.target.value });
                    actualizarElemento(selectedId, { fill: e.target.value });
                  }}
                />
              </label>

              <label>
                Tamaño:
                <input
                  type="number"
                  value={textStyle.fontSize}
                  style={{ width: "60px" }}
                  onChange={(e) => {
                    const size = parseInt(e.target.value);
                    setTextStyle({ ...textStyle, fontSize: size });
                    actualizarElemento(selectedId, { fontSize: size });
                  }}
                />
              </label>

              <label>
                Fuente:
                <select
                  value={textStyle.fontFamily}
                  onChange={(e) => {
                    setTextStyle({ ...textStyle, fontFamily: e.target.value });
                    actualizarElemento(selectedId, { fontFamily: e.target.value });
                  }}
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </label>

              <label>
                Estilo:
                <select
                  value={textStyle.fontStyle}
                  onChange={(e) => {
                    setTextStyle({ ...textStyle, fontStyle: e.target.value });
                    actualizarElemento(selectedId, { fontStyle: e.target.value });
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Negrita</option>
                  <option value="italic">Cursiva</option>
                </select>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HerramientaDiseño;




