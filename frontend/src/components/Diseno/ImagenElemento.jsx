import React, { useRef, useEffect } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
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

const ImagenElemento = ({ el, onUpdate, isSelected, onSelect, onTransform }) => {
  const [img] = useImage(el.url, "Anonymous");
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        id={`image-${el.id}`}
        ref={shapeRef}
        image={img}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        rotation={el.rotation || 0}
        draggable
        onClick={() => onSelect && onSelect()}
        onTap={() => onSelect && onSelect()}
        onDragEnd={(e) => {
          onUpdate(el.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransform={(e) => {
          // Actualizar en tiempo real mientras se transforma
          if (isSelected && onTransform) {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            const rotation = node.rotation();
            const width = Math.max(20, Math.round(node.width() * scaleX));
            const height = Math.max(20, Math.round(node.height() * scaleY));
            onTransform(rotation, width, height);
          }
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          // Reset scale and update width/height instead
          node.scaleX(1);
          node.scaleY(1);
          
          onUpdate(el.id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(20, Math.round(node.width() * scaleX)),
            height: Math.max(20, Math.round(node.height() * scaleY)),
          });
        }}
      />
      {isSelected && (
        <Transformer 
          ref={trRef} 
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default ImagenElemento;