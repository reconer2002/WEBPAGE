import React, { useEffect, useMemo, useState } from 'react';
import productsService from '../services/productsService';
import cartService from '../services/cartService';
import './Disenos.css';
import Header from '../components/Main/Header';
import Footer from '../components/Main/Footer';
import { ShoppingCart } from 'lucide-react';

const Disenos = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await productsService.searchProducts(query);
      setProducts(res);
    } catch (e) {
      console.error(e);
      setMessage('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* primera carga */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    load();
  };

  const add = async (p) => {
    const ok = await productsService.checkAvailability(p.id, 1);
    if (!ok) { setMessage('Sin stock para ' + p.name); return; }
    cartService.addItem(p, 1);
    setMessage('Agregado: ' + p.name);
  };

  const badge = (p) => {
    const tags = [];
    if (p.discountPercent) tags.push(`${p.discountPercent}% OFF`);
    if (p.bulkDiscount) tags.push(`-${p.bulkDiscount.percent}% x${p.bulkDiscount.minQty}`);
    return tags.join(' · ');
  };

  const totalProducts = useMemo(() => products.length, [products]);

  return (
    <>
      <Header />
      <div className="disenos-page">
        <div className="disenos-header">
          <h2>Tus diseños</h2>
          <form className="search" onSubmit={onSearch}>
            <input placeholder="Buscar producto..." value={query} onChange={e => setQuery(e.target.value)} />
            <button className="btn" type="submit">Buscar</button>
          </form>
        </div>

        {message && <div className="msg">{message}</div>}

        <div className="grid">
          {loading && <div className="loading">Cargando...</div>}
          {!loading && products.map(p => (
            <div key={p.id} className="card">
              <div className="img" style={{ backgroundImage: `url(${p.image})` }} />
              <div className="info">
                <div className="name">{p.name}</div>
                <div className="meta">
                  <span className="price">${p.price.toLocaleString('es-CL')}</span>
                  <span className={p.stock > 0 ? 'stock ok' : 'stock low'}>{p.stock} disp.</span>
                </div>
                <div className="tags">{badge(p) || ' '}</div>
                <button className="btn add" onClick={() => add(p)}>
                  <ShoppingCart size={16} /> Agregar al carrito
                </button>
              </div>
            </div>
          ))}
          {!loading && totalProducts === 0 && (
            <div className="empty">Sin resultados</div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Disenos;

