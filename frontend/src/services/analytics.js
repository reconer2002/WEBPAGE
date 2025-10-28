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