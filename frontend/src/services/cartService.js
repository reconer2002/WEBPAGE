// src/services/cartService.js
// Carrito en localStorage + reglas de descuentos

const CART_KEY = 'cart_v1';

const loadCart = () => {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
};

const totalCount = (items) => items.reduce((sum, i) => sum + (parseInt(i.quantity, 10) || 0), 0);

const notify = (items) => {
  try {
    const count = totalCount(items);
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count, items } }));
  } catch {}
};

const saveCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  notify(items);
  return items;
};

const getCart = () => loadCart();

const getCount = () => totalCount(loadCart());

const findIndex = (items, productId) => items.findIndex(i => i.productId === productId);

const addItem = (product, qty = 1) => {
  const items = loadCart();
  const idx = findIndex(items, product.id);
  if (idx >= 0) {
    items[idx].quantity += qty;
  } else {
    items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image: product.image,
      discountPercent: product.discountPercent || 0,
      bulkDiscount: product.bulkDiscount || null,
    });
  }
  return saveCart(items);
};

const removeItem = (productId) => {
  const items = loadCart().filter(i => i.productId !== productId);
  return saveCart(items);
};

const setQuantity = (productId, qty) => {
  const items = loadCart();
  const idx = findIndex(items, productId);
  if (idx >= 0) {
    items[idx].quantity = Math.max(1, qty);
  }
  return saveCart(items);
};

const clear = () => saveCart([]);

// Descuentos: por producto (percent) + por volumen (bulkDiscount)
const computeLineTotals = (item) => {
  const base = item.price * item.quantity;
  let discount = 0;
  if (item.discountPercent) discount += base * (item.discountPercent / 100);
  if (item.bulkDiscount && item.quantity >= item.bulkDiscount.minQty) {
    discount += base * (item.bulkDiscount.percent / 100);
  }
  const total = Math.max(0, base - Math.floor(discount));
  return { base, discount: Math.floor(discount), total };
};

const computeCartTotals = (items) => {
  let base = 0, discount = 0, total = 0;
  for (const it of items) {
    const t = computeLineTotals(it);
    base += t.base; discount += t.discount; total += t.total;
  }
  return { base, discount, total };
};

export default {
  getCart,
  getCount,
  addItem,
  removeItem,
  setQuantity,
  clear,
  computeLineTotals,
  computeCartTotals,
};
