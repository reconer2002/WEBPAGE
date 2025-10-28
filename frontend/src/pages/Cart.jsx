import React, { useEffect, useMemo, useState } from "react";
import cartService from "../services/cartService";
import "./Cart.css";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";

const QtyControl = ({ value, onDec, onInc }) => (
  <div className="qty-control">
    <button type="button" onClick={onDec} aria-label="Disminuir">
      <Minus size={16} />
    </button>
    <span>{value}</span>
    <button type="button" onClick={onInc} aria-label="Aumentar">
      <Plus size={16} />
    </button>
  </div>
);

const Cart = ({ user }) => {
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState({});

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cartItems = await cartService.getCart();
        setItems(cartItems || []);
        // Inicializa inventario a partir de los items (stock por producto)
        const inv = {};
        (cartItems || []).forEach((it) => {
          if (typeof it.stock !== "undefined") inv[it.product_id] = it.stock;
        });
        setInventory(inv);
      } catch (error) {
        console.error("Error al cargar el carrito:", error);
        setMessage("Error al cargar el carrito: " + error.message);
      }
    };
    if (user) {
      fetchCart();
    }
  }, [user]);
  const [search, setSearch] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  // Mantener inventario actualizado basado en items
  useEffect(() => {
    const inv = {};
    (items || []).forEach((it) => {
      if (typeof it.stock !== "undefined") inv[it.product_id] = it.stock;
    });
    setInventory((prev) => ({ ...prev, ...inv }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
  const resolveImage = (u) => {
    const s = (u && String(u).trim()) || "";
    if (!s) return "";
    if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:")) return s;
    if (s.startsWith("/img/")) return `${BACKEND_URL}${s}`;
    return s;
  };

  const totals = useMemo(
    () => cartService.computeCartTotals(filtered),
    [filtered]
  );

  // Cargar catálogo (articulos) una sola vez cuando el usuario enfoca o escribe
  const ensureCatalog = async () => {
    if (catalog.length || loadingCatalog) return;
    try {
      setLoadingCatalog(true);
      const list = await (await import("../services/articulosService")).default.getArticulos();
      setCatalog(list || []);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const catalogResults = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return [];
    return (catalog || [])
      .filter((p) => String(p.nombre || "").toLowerCase().includes(q))
      .slice(0, 6);
  }, [catalog, catalogQuery]);

  const dec = async (productId, designId = 0) => {
    const it = items.find((i) => i.product_id === productId && (i.design_id ?? 0) === (designId ?? 0));
    if (!it) return;
    const current = parseInt(it.quantity, 10) || 1;
    const newQty = current - 1;
    let updated;
    if (newQty <= 0) {
      updated = await cartService.removeItem(productId, designId ?? 0);
    } else {
      updated = await cartService.setQuantity(productId, newQty, designId ?? 0);
    }
    if (Array.isArray(updated)) setItems(updated);
  };

  const inc = async (productId, designId = 0) => {
    const it = items.find((i) => i.product_id === productId && (i.design_id ?? 0) === (designId ?? 0));
    if (!it) return;
    const desired = (parseInt(it.quantity, 10) || 1) + 1;
    const updated = await cartService.setQuantity(productId, desired, designId ?? 0);
    if (Array.isArray(updated)) setItems(updated);
  };

  const remove = async (productId, designId = 0) => {
    const updated = await cartService.removeItem(productId, designId ?? 0);
    if (Array.isArray(updated)) setItems(updated);
  };

  const checkAvailabilityAll = async () => {
    setChecking(true);
    setMessage("");
    try {
      const res = await cartService.checkAvailability();
      // Actualiza inventario local con lo que sabemos del carrito
      const local = { ...inventory };
      (items || []).forEach((it) => {
        const p = res?.problems?.find((x) => x.product_id === it.product_id);
        if (p) local[it.product_id] = p.stock ?? 0; // stock insuficiente reportado
      });
      setInventory(local);
      if (res?.ok) {
        setMessage("Todos los artículos están disponibles.");
      } else {
        setMessage("Algunos artículos superan el stock disponible.");
      }
    } catch (err) {
      console.error("Error comprobando disponibilidad:", err);
      setMessage("No se pudo comprobar disponibilidad");
    }
    setChecking(false);
  };

  const checkout = async () => {
    // Redirigir al nuevo flujo de checkout para pagar con pasarela
    window.location.href = '/checkout';
  };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <ShoppingCart size={24} />
        <h2>Carrito de compras</h2>
      </div>

      <div className="cart-tools">
        <div className="cart-searches">
          <input
            type="text"
            placeholder="Buscar en el carrito..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="catalog-search">
            <input
              type="search"
              placeholder="Buscar producto para agregar..."
              value={catalogQuery}
              onFocus={ensureCatalog}
              onChange={(e) => setCatalogQuery(e.target.value)}
            />
            {catalogQuery && (
              <div className="catalog-results">
                {loadingCatalog ? (
                  <div className="catalog-empty">Cargando…</div>
                ) : catalogResults.length === 0 ? (
                  <div className="catalog-empty">Sin resultados</div>
                ) : (
                  catalogResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="catalog-item"
                      onClick={async () => {
                        const updated = await cartService.addItemFromArticulo(p.id, 1);
                        if (Array.isArray(updated)) {
                          setItems(updated);
                          setMessage("");
                        } else {
                          setMessage("No se pudo agregar el producto al carrito.");
                        }
                        setCatalogQuery("");
                      }}
                    >
                      <img src={resolveImage(p.foto) || `${BACKEND_URL}/img/Logo.png`} alt="" />
                      <span>{p.nombre}</span>
                      <small>{p.precio != null ? `$${Number(p.precio).toLocaleString('es-CL')}` : ''}</small>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="tool-actions">
          <button
            type="button"
            className="btn"
            onClick={checkAvailabilityAll}
            disabled={checking}
          >
            {checking ? "Comprobando..." : "Comprobar disponibilidad"}
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={checkout}
            disabled={!items.length}
          >
            Finalizar compra
          </button>
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
        {filtered.map((item) => {
          const { base, discount, total } = cartService.computeLineTotals(item);
          const stock = inventory[item.product_id] ?? 0;
          const ok = stock >= item.quantity;
          return (
            <div key={`${item.product_id}-${item.design_id ?? 0}`} className="cart-row">
              <div className="cell product">
                <img
                  src={resolveImage(item.image) || `${BACKEND_URL}/img/Logo.png`}
                  alt={item.name}
                  onError={(e) => {
                    const fb = `${BACKEND_URL}/img/Logo.png`;
                    if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
                  }}
                />
                <span>{item.name}</span>
              </div>
              <div className="cell price">
                ${item.price.toLocaleString("es-CL")}
              </div>
              <div className="cell qty">
                <QtyControl
                  value={item.quantity}
                  onDec={() => dec(item.product_id, item.design_id ?? 0)}
                  onInc={() => inc(item.product_id, item.design_id ?? 0)}
                />
              </div>
              <div className={`cell stock ${ok ? "ok" : "low"}`}>
                {ok ? `OK (${stock} disp.)` : `No disp. (${stock})`}
              </div>
              <div className="cell discount">
                {discount > 0 ? `-$${discount.toLocaleString("es-CL")}` : "—"}
              </div>
              <div className="cell total">${total.toLocaleString("es-CL")}</div>
              <div className="cell actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="Quitar"
                  onClick={() => remove(item.product_id, item.design_id ?? 0)}
                >
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
        <div>
          <span>Subtotal</span>
          <strong>${totals.base.toLocaleString("es-CL")}</strong>
        </div>
        <div>
          <span>Descuentos</span>
          <strong className="disc">
            -${totals.discount.toLocaleString("es-CL")}
          </strong>
        </div>
        <div className="sum-total">
          <span>Total</span>
          <strong>${totals.total.toLocaleString("es-CL")}</strong>
        </div>
      </div>
    </div>
  );
};

export default Cart;