import React from 'react';

export default function SubcategoriaSelector({ subcategorias, activa, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
      {subcategorias.map(sub => (
        <button
          key={sub}
          onClick={() => onSelect(sub)}
          style={{
            fontWeight: sub === activa ? 'bold' : 'normal',
            backgroundColor: sub === activa ? '#ddd' : '#f4f4f4',
          }}
        >
          {sub}
        </button>
      ))}
    </div>
  );
}