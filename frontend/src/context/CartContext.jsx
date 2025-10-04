import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (diseño) => {
    const newItem = {
      id: Date.now() + Math.random(), // ID único
      diseñoId: diseño.id || Date.now(),
      nombre: diseño.nombre || 'Diseño personalizado',
      imagen: diseño.imagenPrincipal || diseño.imagen,
      fecha: new Date().toISOString(),
      precio: 25990 // Precio simulado
    };
    
    setCartItems(prevItems => [...prevItems, newItem]);
    
    // Mostrar notificación visual (opcional)
    console.log('Agregado al carrito:', newItem);
  };

  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartCount = () => {
    return cartItems.length;
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getCartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};