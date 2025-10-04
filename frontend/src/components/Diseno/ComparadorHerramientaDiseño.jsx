import React, { useState } from "react";
import HerramientaDiseñoOriginal from "./HerramientaDiseño";
import HerramientaDiseñoNew from "./HerramientaDiseñoNew";
import "./HerramientaDiseño.css";

const ComparadorHerramientaDiseño = ({ onDisenoGuardado }) => {
  const [version, setVersion] = useState('new'); // 'original' o 'new'

  return (
    <div>
      <div style={{ 
        padding: '10px', 
        background: '#f3f4f6', 
        borderBottom: '1px solid #d1d5db',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <strong>Versión de la Herramienta:</strong>
        <button 
          onClick={() => setVersion('original')}
          style={{
            padding: '5px 10px',
            background: version === 'original' ? '#3b82f6' : '#e5e7eb',
            color: version === 'original' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Original (883 líneas)
        </button>
        <button 
          onClick={() => setVersion('new')}
          style={{
            padding: '5px 10px',
            background: version === 'new' ? '#10b981' : '#e5e7eb',
            color: version === 'new' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refactorizada (5 archivos)
        </button>
        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '10px' }}>
          {version === 'original' 
            ? 'Usando versión monolítica original' 
            : 'Usando versión modular refactorizada'
          }
        </span>
      </div>
      
      {version === 'original' ? (
        <HerramientaDiseñoOriginal onDisenoGuardado={onDisenoGuardado} />
      ) : (
        <HerramientaDiseñoNew onDisenoGuardado={onDisenoGuardado} />
      )}
    </div>
  );
};

export default ComparadorHerramientaDiseño;