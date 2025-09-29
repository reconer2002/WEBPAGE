import React, { useEffect, useMemo, useState } from 'react';
import cartService from '../services/cartService';
import productsService from '../services/productsService';
import './Cart.css';
import Header from '../components/Main/Header';
import Footer from '../components/Main/Footer';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';

const QtyControl = ({ value, onDec, onInc }) => (
  <div className="qty-control">
    <button onClick={onDec} aria-label="Disminuir"><Minus size={16} /></button>
    <span>{value}</span>
    <button onClick={onInc} aria-label="Aumentar"><Plus size={16} /></button>
  </div>
);

const Cart = () => {
  const [items, setItems] = useState(cartService.getCart());
  const [inventory, setInventory] = useState({});
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const load = async () => {
      const inv = await productsService.getProductsWithStock();
      const invMap = {}; inv.forEach(p => invMap[p.id] = p.stock);
      setInventory(invMap);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const totals = useMemo(() => cartService.computeCartTotals(filtered), [filtered]);

  const dec = (id) => {
    const it = items.find(i => i.productId === id);
    if (!it) return;
    const newQty = Math.max(1, it.quantity - 1);
    setItems(cartService.setQuantity(id, newQty));
  };

  const inc = async (id) => {
    const it = items.find(i => i.productId === id);
    if (!it) return;
    const desired = it.quantity + 1;
    const ok = await productsService.checkAvailability(id, desired);
    if (!ok) {
      setMessage('No hay stock suficiente para ' + it.name);
      return;
    }
    setItems(cartService.setQuantity(id, desired));
  };

  const remove = (id) => {
    setItems(cartService.removeItem(id));
  };

  const checkAvailabilityAll = async () => {
    setChecking(true); setMessage('');
    const data = await productsService.getProductsWithStock();
    const map = {}; data.forEach(p => map[p.id] = p.stock);
    setInventory(map);
    const problems = items.filter(i => (map[i.productId] ?? 0) < i.quantity);
    if (problems.length) setMessage('Algunos artículos superan el stock disponible.');
    else setMessage('Todos los artículos están disponibles.');
    setChecking(false);
  };

  const checkout = async () => {
    // Simula actualización de existencias
    await productsService.updateStock(items.map(i => ({ productId: i.productId, delta: -i.quantity })));
    cartService.clear();
    setItems([]);
    const data = await productsService.getProductsWithStock();
    const map = {}; data.forEach(p => map[p.id] = p.stock);
    setInventory(map);
    setMessage('Compra realizada. Existencias actualizadas.');
  };

  return (
    <>
      <Header />
      <div className="cart-page">
        <div className="cart-header">
          <ShoppingCart size={24} />
          <h2>Carrito de compras</h2>
        </div>

        <div className="cart-tools">
          <input
            type="text"
            placeholder="Buscar en el carrito..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="tool-actions">
            <button className="btn" onClick={checkAvailabilityAll} disabled={checking}>
              {checking ? 'Comprobando...' : 'Comprobar disponibilidad'}
            </button>
            <button className="btn primary" onClick={checkout} disabled={!items.length}>Finalizar compra</button>
          </div>
        </div>

        {message && <div className="cart-message">{message}</div>}

        <div className="cart-table">
          <div className="cart-thead">
            <div>Diseño</div>
            <div>Precio</div>
            <div>Cantidad</div>
            <div>Disponibilidad</div>
            <div>Descuentos</div>
            <div>Total</div>
            <div>Acciones</div>
          </div>
          {filtered.map(item => {
            const { base, discount, total } = cartService.computeLineTotals(item);
            const stock = inventory[item.productId] ?? 0;
            const ok = stock >= item.quantity;
            return (
              <div key={item.productId} className="cart-row">
                <div className="cell product">
                  <img src={item.image} alt={item.name} />
                  <span>{item.name}</span>
                </div>
                <div className="cell price">${item.price.toLocaleString('es-CL')}</div>
                <div className="cell qty">
                  <QtyControl value={item.quantity} onDec={() => dec(item.productId)} onInc={() => inc(item.productId)} />
                </div>
                <div className={`cell stock ${ok ? 'ok' : 'low'}`}>
                  {ok ? `OK (${stock} disp.)` : `No disp. (${stock})`}
                </div>
                <div className="cell discount">
                  {discount > 0 ? `-$${discount.toLocaleString('es-CL')}` : '—'}
                </div>
                <div className="cell total">${total.toLocaleString('es-CL')}</div>
                <div className="cell actions">
                  <button className="icon-btn" title="Quitar" onClick={() => remove(item.productId)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <div className="cart-empty">No hay diseños en el carrito.</div>
          )}
        </div>

        <div className="cart-summary">
          <div><span>Subtotal</span><strong>${totals.base.toLocaleString('es-CL')}</strong></div>
          <div><span>Descuentos</span><strong className="disc">-${totals.discount.toLocaleString('es-CL')}</strong></div>
          <div className="sum-total"><span>Total</span><strong>${totals.total.toLocaleString('es-CL')}</strong></div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;

