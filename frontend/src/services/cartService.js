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

// Agregar por diseño existente (designId). Si no hay designId, cae a agregar por artículo.
const addItem = async (productOrArticulo, qty = 1, options = {}) => {
  try {
    const designId = options?.designId;
    if (Number.isFinite(parseInt(designId, 10))) {
      await api.post("/cart/items", { designId: parseInt(designId, 10) });
    } else if (productOrArticulo?.id) {
      // Fallback: crear diseño mínimo desde artículo y agregar
      await api.post("/cart/items-from-articulo", { articuloId: productOrArticulo.id, qty });
    } else {
      throw new Error("Se requiere designId o articuloId válido");
    }
    const items = await getCart();
    notify(items);
    return items;
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    return [];
  }
};

const addItemFromArticulo = async (articuloId, qty = 1) => {
  try {
    await api.post("/cart/items-from-articulo", { articuloId, qty });
    const items = await getCart();
    notify(items);
    return items;
  } catch (error) {
    console.error("Error al agregar desde artículo:", error);
    return null; // no alterar el estado del carrito en error
  }
};

const removeItem = async (productId, designId = 0) => {
  try {
    const q = new URLSearchParams({ designId: String(designId ?? 0) }).toString();
    const res = await api.delete(`/cart/items/${productId}?${q}`);
    let items = Array.isArray(res?.data?.items) ? res.data.items : null;
    if (!items) items = await getCart();
    notify(items);
    return items;
  } catch (error) {
    console.error("Error al eliminar del carrito:", error);
    // Mantener estado consistente en la UI
    const fallback = await getCart();
    notify(fallback);
    return fallback;
  }
};

const setQuantity = async (productId, qty, designId = 0) => {
  try {
    const res = await api.patch(`/cart/items/${productId}`, { qty, designId });
    let items = Array.isArray(res?.data?.items) ? res.data.items : null;
    if (!items) items = await getCart();
    notify(items);
    return items;
  } catch (error) {
    console.error("Error al actualizar cantidad:", error);
    const fallback = await getCart();
    notify(fallback);
    return fallback;
  }
};

const clear = async () => {
  try {
    const items = await getCart();
    for (const item of items) {
      await removeItem(item.productId);
    }
    notify([]);
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
    // Tras checkout el carrito queda vacío
    notify([]);
    return response.data;
  } catch (error) {
    console.error("Error al realizar el checkout:", error);
    throw error;
  }
};

// Reglas por cantidad (fallback si el producto no define bulk)
// VITE_BULK_RULES="3:10,4:15" => 3+ unidades 10%, 4+ unidades 15%
const parseBulkRules = (s) =>
  String(s || '3:10,4:15')
    .split(',')
    .map((p) => p.trim())
    .map((x) => {
      const [q, pc] = x.split(':').map((n) => parseInt(n, 10));
      return Number.isFinite(q) && Number.isFinite(pc) ? { min: q, percent: pc } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.min - b.min);

const BULK_TIERS = parseBulkRules(import.meta.env.VITE_BULK_RULES);

// Función auxiliar para calcular totales
const computeLineTotals = (item) => {
  const base = item.price * item.quantity;
  let discount = 0;
  if (item.discount_percent) discount += base * (item.discount_percent / 100);
  if (item.bulk_min_qty && item.bulk_percent && item.quantity >= item.bulk_min_qty) {
    discount += base * (item.bulk_percent / 100);
  } else if (BULK_TIERS.length) {
    let tier = null;
    for (const t of BULK_TIERS) {
      if (item.quantity >= t.min) tier = t; else break;
    }
    if (tier) discount += base * (tier.percent / 100);
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
  addItemFromArticulo,
  removeItem,
  setQuantity,
  clear,
  checkAvailability,
  checkout,
  computeLineTotals,
  computeCartTotals,
  // Forzar un evento de actualización (por ejemplo, tras pago exitoso)
  broadcast: (items) => notify(Array.isArray(items) ? items : []),
};
