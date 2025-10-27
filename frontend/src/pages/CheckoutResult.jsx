import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import cartService from '../services/cartService';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const CheckoutResult = () => {
  const q = useQuery();
  const status = q.get('status');
  const orderId = q.get('orderId');
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'success') {
      // Asegurar actualización de icono incluso si el usuario llega directo aquí
      cartService.broadcast([]);
    }
  }, [status]);

  let title = 'Resultado del pago';
  let msg = 'Estado desconocido';
  if (status === 'success') { title = 'Pago exitoso'; msg = `Tu orden #${orderId} fue pagada correctamente.`; }
  else if (status === 'cancel') { title = 'Pago cancelado'; msg = 'Cancelaste el pago. Puedes intentarlo nuevamente.'; }
  else if (status === 'error') { title = 'Error en el pago'; msg = 'Ocurrió un problema al procesar tu pago.'; }

  return (
    <div style={{ maxWidth: 520, margin: '24px auto', padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
      <h2>{title}</h2>
      <p>{msg}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={() => navigate('/disenos')}>Ir a Diseños</button>
        <button className="btn primary" onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    </div>
  );
};

export default CheckoutResult;
