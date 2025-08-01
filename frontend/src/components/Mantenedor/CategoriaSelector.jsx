import React from 'react';

export default function CategoriaSelector({ categorias, activa, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      {categorias.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          style={{
            fontWeight: cat === activa ? 'bold' : 'normal',
            backgroundColor: cat === activa ? '#ccc' : '#eee',
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}