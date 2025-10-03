import api from "./api";

const CART_KEY = "cart_v1";

const loadCart = () => {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const totalCount = (items) =>
  items.reduce((sum, i) => sum + (parseInt(i.quantity, 10) || 0), 0);

const notify = (items) => {
  try {
    const count = totalCount(items);
    window.dispatchEvent(
      new CustomEvent("cart:updated", { detail: { count, items } })
    );
  } catch {}
};

const saveCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  notify(items);
  return items;
};

const getCart = async () => {
  try {
    const response = await api.get("/cart");
    return response.data.items;
  } catch (error) {
    console.error("Error al obtener el carrito:", error);
    return [];
  }
};

const getCount = async () => {
  const items = await getCart();
  return totalCount(items);
};

const addItem = async (product, qty = 1) => {
  try {
    await api.post("/cart/items", { productId: product.id, qty });
    return await getCart();
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    return [];
  }
};

const removeItem = async (productId) => {
  try {
    await api.delete(`/cart/items/${productId}`);
    return await getCart();
  } catch (error) {
    console.error("Error al eliminar del carrito:", error);
    return [];
  }
};

const setQuantity = async (productId, qty) => {
  try {
    await api.patch(`/cart/items/${productId}`, { qty });
    return await getCart();
  } catch (error) {
    console.error("Error al actualizar cantidad:", error);
    return [];
  }
};

const clear = async () => {
  try {
    const items = await getCart();
    for (const item of items) {
      await removeItem(item.productId);
    }
    return [];
  } catch (error) {
    console.error("Error al limpiar el carrito:", error);
    return [];
  }
};

const checkAvailability = async () => {
  try {
    const response = await api.post("/cart/check-availability");
    return response.data;
  } catch (error) {
    console.error("Error al verificar disponibilidad:", error);
    return { ok: false, problems: [] };
  }
};

const checkout = async () => {
  try {
    const response = await api.post("/cart/checkout");
    return response.data;
  } catch (error) {
    console.error("Error al realizar el checkout:", error);
    throw error;
  }
};

// Función auxiliar para calcular totales
const computeLineTotals = (item) => {
  const base = item.price * item.quantity;
  let discount = 0;
  if (item.discount_percent) discount += base * (item.discount_percent / 100);
  if (
    item.bulk_min_qty &&
    item.bulk_percent &&
    item.quantity >= item.bulk_min_qty
  ) {
    discount += base * (item.bulk_percent / 100);
  }
  const total = Math.max(0, base - Math.floor(discount));
  return { base, discount: Math.floor(discount), total };
};

const computeCartTotals = (items) => {
  let base = 0,
    discount = 0,
    total = 0;
  for (const it of items) {
    const t = computeLineTotals(it);
    base += t.base;
    discount += t.discount;
    total += t.total;
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
  checkAvailability,
  checkout,
  computeLineTotals,
  computeCartTotals,
};
