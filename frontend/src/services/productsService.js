// src/services/productsService.js
// Capa de productos + inventario local (sin tocar backend)
// - Carga catálogo inicial desde /products.json (carpeta public)
// - Persiste inventario en localStorage para simular disponibilidad y actualización de existencias

const CATALOG_URL = '/products.json';
const INV_KEY = 'inventory_v1';

const readJSON = async (url) => {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Error fetching ' + url);
  return res.json();
};

const loadCatalog = async () => {
  return readJSON(CATALOG_URL);
};

const getInventory = async () => {
  // Si no existe inventario en localStorage, lo inicializamos con el catálogo
  const raw = localStorage.getItem(INV_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  const catalog = await loadCatalog();
  const inv = {};
  catalog.forEach(p => { inv[p.id] = { stock: p.stock } });
  localStorage.setItem(INV_KEY, JSON.stringify(inv));
  return inv;
};

const getProductsWithStock = async () => {
  const [catalog, inv] = await Promise.all([loadCatalog(), getInventory()]);
  return catalog.map(p => ({ ...p, stock: inv[p.id]?.stock ?? p.stock }));
};

const searchProducts = async (query) => {
  const q = String(query || '').trim().toLowerCase();
  const products = await getProductsWithStock();
  if (!q) return products;
  return products.filter(p => p.name.toLowerCase().includes(q));
};

const checkAvailability = async (productId, desiredQty) => {
  const inv = await getInventory();
  const stock = inv[productId]?.stock ?? 0;
  return stock >= desiredQty;
};

const updateStock = async (updates /* [{ productId, delta }] */) => {
  const inv = await getInventory();
  for (const { productId, delta } of updates) {
    const curr = inv[productId]?.stock ?? 0;
    inv[productId] = { stock: Math.max(0, curr + delta) };
  }
  localStorage.setItem(INV_KEY, JSON.stringify(inv));
  return inv;
};

export default {
  getProductsWithStock,
  searchProducts,
  checkAvailability,
  updateStock,
};

