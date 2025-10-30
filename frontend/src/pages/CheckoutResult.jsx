import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import cartService from '../services/cartService';

import { Analytics } from '../services/analytics';

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
      try {
        // Recuperar los datos guardados en sessionStorage
        const dataStr = sessionStorage.getItem('ga_purchase_data');

        if (dataStr) {
          const purchaseData = JSON.parse(dataStr);

          // Verificamos que el transaction_id coincida (o usamos el de la URL si falta)
          if (!purchaseData.transaction_id && orderId) {
             purchaseData.transaction_id = orderId;
          }

          // ¡Disparar el evento de compra!
          if (purchaseData.transaction_id && purchaseData.items) { // Asegurarse que hay datos mínimos
             Analytics.purchase(purchaseData);
             console.log("GA: Evento 'purchase' enviado", purchaseData); // Log para depuración
          } else {
             console.warn("GA: Faltan datos esenciales (transaction_id o items) para enviar 'purchase'.", purchaseData);
          }


          // Limpiar sessionStorage para que no se dispare de nuevo
          sessionStorage.removeItem('ga_purchase_data');

        } else {
          // Fallback por si el usuario recargó y perdió sessionStorage
          // Enviar solo el ID (menos ideal, pero mejor que nada)
          console.warn("GA: No se encontraron datos de 'purchase' en sessionStorage. Enviando solo transaction_id.");
          // Verifica si tu función Analytics.purchase puede manejar un objeto parcial
          if (orderId) {
              Analytics.purchase({ transaction_id: orderId, value: 0, items: [] });
              console.log("GA: Evento 'purchase' (fallback) enviado solo con transaction_id:", orderId);
          } else {
              console.error("GA: No se pudo enviar 'purchase' (fallback) porque no hay orderId.");
          }
        }

      } catch (gaError) {
        console.error("Error al procesar o enviar evento 'purchase' a GA:", gaError);
      }
    }
  }, [status, orderId]);

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