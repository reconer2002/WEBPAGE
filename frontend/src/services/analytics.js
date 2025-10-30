// src/analytics.js

// Función genérica para disparar eventos
function sendEvent(name, params = {}) {
  if (window.gtag) {
    window.gtag('event', name, params)
  } else {
    console.warn('GA no está inicializado. Evento no enviado:', name, params)
  }
}

// Eventos predefinidos para e-commerce
export const Analytics = {

  // --- 🛑 NUEVA FUNCIÓN AÑADIDA ---
  /**
   * Asigna un User-ID anónimo a la sesión de Google Analytics.
   * @param {string} userId - El ID de usuario (ej: de tu base de datos)
   */
  setUserId: (userId) => {
    if (window.gtag) {
      // Esta es la función nativa para asignar el 'user_id'
      window.gtag('set', { 'user_id': userId });
    } else {
      console.warn('GA no está inicializado. User-ID no asignado.');
    }
  },
  // --- FIN DE LA FUNCIÓN AÑADIDA ---

  // Usuario ve un producto
  viewProduct: ({ id, name, category, price, currency = 'USD' }) => {
    sendEvent('view_item', {
      items: [{ id, name, category, price, currency }],
    })
  },

  trackEvent: (name, params) => {
    if (window.gtag) {
      window.gtag('event', name, params)
    }
  },

  // Usuario agrega producto al carrito
  addToCart: ({ id, name, quantity = 1, price, currency = 'USD' }) => {
    sendEvent('add_to_cart', {
      items: [{ id, name, quantity, price, currency }],
    })
  },

  // Usuario inicia checkout
  beginCheckout: ({ items }) => {
    sendEvent('begin_checkout', { items })
  },

  // Usuario completa la compra
  purchase: ({ transaction_id, value, currency = 'USD', items }) => {
    sendEvent('purchase', { transaction_id, value, currency, items })
  },

  // Usuario interactúa con cualquier botón
  buttonClick: ({ name, category }) => {
    sendEvent('button_click', { name, category })
  },
}