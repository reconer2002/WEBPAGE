import React from "react";
import { Stage, Layer, Text, Image as KonvaImage, Transformer } from "react-konva";
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
import ImagenElemento from "../../ImagenElemento";

const CanvasDiseño = ({
  canvasWidth,
  canvasHeight,
  imagenesVistas,
  vistaActual,
  elementos,
  selectedId,
  stageRef,
  onSelectElement,
  onUpdateElement,
  onDeselect,
  onSyncTextState,
  onSyncImageState
}) => {
  const [baseImage] = useImage(resolveUrl(imagenesVistas[vistaActual] || ""), 'anonymous');

  return (
    <div className="preview-column">
      <div className="canvas-inner">
        <div className="stage-wrapper">
          <Stage 
            width={canvasWidth} 
            height={canvasHeight} 
            ref={stageRef} 
            onMouseDown={(e) => { 
              if (e.target === e.target.getStage()) onDeselect(); 
            }}
          >
            <Layer>
              {baseImage && <KonvaImage image={baseImage} width={canvasWidth} height={canvasHeight} />}
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
                        onDragEnd={(e) => onUpdateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                        onTransform={(e) => {
                          const node = e.target;
                          const newRotation = node.rotation();
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();
                          const newFontSize = Math.max(8, Math.round(el.fontSize * Math.max(scaleX, scaleY)));
                          
                          // Sincronizar estado en tiempo real
                          if (isSelected && onSyncTextState) {
                            onSyncTextState(el.id, newFontSize, newRotation);
                          }
                        }}
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();
                          node.scaleX(1);
                          node.scaleY(1);
                          const newFontSize = Math.max(8, Math.round(el.fontSize * Math.max(scaleX, scaleY)));
                          const newRotation = node.rotation();
                          onUpdateElement(el.id, { 
                            x: node.x(), 
                            y: node.y(), 
                            rotation: newRotation, 
                            fontSize: newFontSize, 
                            scale: 1 
                          });
                        }}
                        onDblClick={() => onSelectElement(el)}
                        onClick={() => onSelectElement(el)}
                      />
                      {isSelected && (
                        <Transformer 
                          rotateEnabled={true} 
                          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} 
                          boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)} 
                        />
                      )}
                    </React.Fragment>
                  );
                }
                if (el.type === "image") {
                  return (
                    <ImagenElemento 
                      key={el.id} 
                      el={el} 
                      onUpdate={onUpdateElement} 
                      isSelected={selectedId === el.id} 
                      onSelect={() => onSelectElement(el)} 
                      onTransform={(rotation, width, height) => {
                        if (selectedId === el.id && onSyncImageState) {
                          onSyncImageState(el.id, rotation, width, height);
                        }
                      }} 
                    />
                  );
                }
                return null;
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default CanvasDiseño;
