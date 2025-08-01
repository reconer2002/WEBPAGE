import React, { useState } from 'react';
import CategoriaSelector from './CategoriaSelector';
import SubcategoriaSelector from './SubcategoriaSelector';
import UsuariosTable from './UsuariosTable';

const categorias = {
  USUARIOS: ['usuarios', 'roles'],
};

export default function MantenedorLayout() {
  const [categoriaActiva, setCategoriaActiva] = useState('USUARIOS');
  const [subcategoriaActiva, setSubcategoriaActiva] = useState('usuarios');

  return (
    <div style={{ padding: '2rem' }}>
      <h2>MANTENEDOR</h2>
      <CategoriaSelector
        categorias={Object.keys(categorias)}
        activa={categoriaActiva}
        onSelect={setCategoriaActiva}
      />
      <SubcategoriaSelector
        subcategorias={categorias[categoriaActiva]}
        activa={subcategoriaActiva}
        onSelect={setSubcategoriaActiva}
      />

      {categoriaActiva === 'USUARIOS' && subcategoriaActiva === 'usuarios' && (
        <UsuariosTable />
      )}

      {/* Aquí agregarías más subcategorías como 'roles' */}
    </div>
  );
}