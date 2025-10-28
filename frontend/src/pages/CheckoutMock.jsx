import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import checkoutService from '../services/checkoutService';
import cartService from '../services/cartService';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const CheckoutMock = () => {
  const q = useQuery();
  const orderId = parseInt(q.get('orderId'), 10);
  const token = q.get('token');
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const confirm = async (approved) => {
    try {
      setProcessing(true); setError(null);
      const res = await checkoutService.confirmMock({ orderId, token, status: approved ? 'approved' : 'rejected' });
      if (res?.status === 'pagado') {
        // Notificar a la app que el carrito quedó vacío (contador = 0)
        cartService.broadcast([]);
        navigate('/checkout/resultado?status=success&orderId=' + orderId);
      } else if (res?.status === 'cancelado') {
        navigate('/checkout/resultado?status=cancel&orderId=' + orderId);
      } else {
        navigate('/checkout/resultado?status=error&orderId=' + orderId);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error confirmando');
    }
    setProcessing(false);
  };

  if (!orderId || !token) return <div style={{ padding: 16 }}>Parámetros inválidos.</div>;

  return (
    <div style={{ maxWidth: 520, margin: '24px auto', padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
      <h2>MockPay</h2>
      <p>Orden #{orderId}</p>
      <p>Simulador de pago para entorno de pruebas.</p>
      {error && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn primary" onClick={() => confirm(true)} disabled={processing}>Pagar</button>
        <button className="btn" onClick={() => confirm(false)} disabled={processing}>Cancelar</button>
      </div>
    </div>
  );
};

export default CheckoutMock;