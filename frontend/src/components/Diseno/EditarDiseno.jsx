import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import disenosService from '../../services/disenosService';
import objetosService from '../../services/objetosService';
import HerramientaDiseño from './HerramientaDiseño';

const EditarDiseno = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialElements, setInitialElements] = useState(null);
  const [initialObjeto, setInitialObjeto] = useState(null);
  const [initialNombre, setInitialNombre] = useState('');
  const [initialElementsByView, setInitialElementsByView] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const design = await disenosService.getDiseno(id);
        setInitialElements(Array.isArray(design.elementos) ? design.elementos : []);
        setInitialNombre(design.nombre || '');
        const byView = design.elementos_por_vista;
        if (byView && typeof byView === 'object') {
          setInitialElementsByView(byView);
        }
        // Cargar objeto correspondiente
        const objetos = await objetosService.getObjetos(design.articulo_id);
        const obj = objetos.find((o) => o.id === design.objeto_id) || objetos[0] || null;
        if (obj) {
          const merged = { ...obj, articulo_nombre: design.articulo_nombre };
          setInitialObjeto(merged);
        }
      } catch (e) {
        console.error('Error cargando diseño para editar:', e);
        setError(e?.response?.data?.error || e?.message || 'No se pudo cargar el diseño');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Cargando diseño…</div>;
  if (error) return (
    <div style={{ padding: 16 }}>
      <p style={{ color: '#b91c1c' }}>{error}</p>
      <button onClick={() => navigate('/disenos')}>Volver</button>
    </div>
  );

  return (
    <div className="disenos-page">
      <div className="disenos-content">
        <HerramientaDiseño editarId={parseInt(id, 10)} />
      </div>
    </div>
  );
};

export default EditarDiseno;