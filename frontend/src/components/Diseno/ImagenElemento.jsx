import React from "react";
import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";

const ImagenElemento = ({ el, onUpdate }) => {
  const [img] = useImage(el.url);

  return (
    <KonvaImage
      image={img}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      draggable
      onDragEnd={(e) => {
        onUpdate(el.id, { x: e.target.x(), y: e.target.y() });
      }}
    />
  );
};

export default ImagenElemento;