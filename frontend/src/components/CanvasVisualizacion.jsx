import React, { useMemo } from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const resolveUrl = (u) => {
  if (!u) return u;
  const s = String(u).trim();
  if (!s) return s;
  if (s.startsWith('data:')) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/img/')) return `${BACKEND_URL}${s}`;
  return s;
};

const ImagenElementoVisualizacion = ({ el }) => {
  const [image] = useImage(resolveUrl(el.src), 'anonymous');

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation || 0}
    />
  );
};

const CanvasVisualizacion = ({ 
  canvasWidth = 600, 
  canvasHeight = 600, 
  imagenBase, 
  elementos = [] 
}) => {
  const [baseImage] = useImage(resolveUrl(imagenBase), 'anonymous');

  // Calcular dimensiones manteniendo el aspect ratio (EXACTAMENTE IGUAL a CanvasDiseño)
  const imageDimensions = useMemo(() => {
    if (!baseImage) return { width: canvasWidth, height: canvasHeight, x: 0, y: 0 };
    
    const imgRatio = baseImage.width / baseImage.height;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let width, height, x = 0, y = 0;
    
    if (imgRatio > canvasRatio) {
      width = canvasWidth;
      height = canvasWidth / imgRatio;
      y = (canvasHeight - height) / 2;
    } else {
      height = canvasHeight;
      width = canvasHeight * imgRatio;
      x = (canvasWidth - width) / 2;
    }
    
    return { width, height, x, y };
  }, [baseImage, canvasWidth, canvasHeight]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#f5f5f5',
      borderRadius: '8px',
      padding: '1rem'
    }}>
      <Stage width={canvasWidth} height={canvasHeight}>
        <Layer>
          {/* Imagen base del objeto/artículo */}
          {baseImage && (
            <KonvaImage 
              image={baseImage} 
              width={imageDimensions.width} 
              height={imageDimensions.height}
              x={imageDimensions.x}
              y={imageDimensions.y}
            />
          )}
          
          {/* Elementos del diseño */}
          {elementos.map((el, idx) => {
            if (el.tipo === "texto" || el.type === "text") {
              return (
                <Text
                  key={el.id || idx}
                  x={(el.x || 0) + imageDimensions.x}
                  y={(el.y || 0) + imageDimensions.y}
                  text={el.contenido || el.text || ""}
                  fontSize={el.tamano || el.fontSize || 20}
                  fill={el.color || el.fill || "#000000"}
                  fontFamily={el.fuente || el.fontFamily || "Arial"}
                  fontStyle={el.fontStyle || "normal"}
                  rotation={el.rotacion || el.rotation || 0}
                  scale={{ x: 1, y: 1 }}
                  offsetX={0}
                  offsetY={0}
                />
              );
            }
            
            if (el.tipo === "imagen" || el.type === "image") {
              return (
                <ImagenElementoVisualizacion 
                  key={el.id || idx} 
                  el={{
                    src: el.url || el.src,
                    x: (el.x || 0) + imageDimensions.x,
                    y: (el.y || 0) + imageDimensions.y,
                    width: el.ancho || el.width || 100,
                    height: el.alto || el.height || 100,
                    rotation: el.rotacion || el.rotation || 0
                  }}
                />
              );
            }
            
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasVisualizacion;
