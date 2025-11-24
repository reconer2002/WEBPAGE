import React, { useEffect, useMemo, useState } from "react";
import cartService from "../services/cartService";
import "./Cart.css";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";

import { Analytics } from "../services/analytics";

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

  const BACKEND_URL = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_BACKEND_URL : "") || "";
  const resolveImage = (u) => {
    const s = (u && String(u).trim()) || "";
    if (!s) return "";
    if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:")) return s;
    if (s.startsWith("/img/")) return `${BACKEND_URL}${s}`;
    return s;
  };

  const totals = useMemo(
    () => cartService.computeCartTotals(items),
    [items]
  );

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

  const goToCheckout = async () => {
      setMessage(""); // Limpiar mensajes
      setChecking(true); // Usar el mismo estado de carga que 'checkAvailabilityAll'
      try {
        const res = await cartService.checkAvailability(); // Siempre verificar antes de ir

        // Actualizar inventario local como en checkAvailabilityAll
        const local = { ...inventory };
        (items || []).forEach((it) => {
          const p = res?.problems?.find((x) => x.product_id === it.product_id);
          if (p) local[it.product_id] = p.stock ?? 0;
          else if (res?.ok && typeof it.stock !== 'undefined') local[it.product_id] = it.stock;
        });
        setInventory(local);

        if (!res?.ok) {
          setMessage("⚠️ Algunos artículos superan el stock disponible. Por favor, ajusta las cantidades antes de continuar.");
          setChecking(false); // Detener carga
          return; // No continuar si hay problemas
        }

        // --- 🛑 IMPLEMENTACIÓN GOOGLE ANALYTICS (BEGIN_CHECKOUT) ---
        try {
          const analyticsItems = items.map((item) => ({ // Usar 'items' originales, no 'filtered'
            item_id: `${item.product_id}-${item.design_id || 0}`,
            item_name: `${item.name || 'Producto desconocido'} - ${item.design_name || 'N/A'}`, // Asegurar que name y design_name existan
            price: item.price || 0, // Asegurar que price exista
            quantity: item.quantity || 1, // Asegurar que quantity exista
          }));
          Analytics.beginCheckout({ items: analyticsItems });
          console.log("GA: Evento begin_checkout enviado", analyticsItems); // Log para depuración
        } catch (gaError) {
          console.error("Error al enviar evento beginCheckout a GA:", gaError);
        }
        // --- FIN DE GOOGLE ANALYTICS ---

        // Si todo está OK, redirigir a la página de checkout
        window.location.href = '/checkout';

      } catch (err) {
        console.error("Error al ir a checkout:", err);
        setMessage("❌ Error al verificar disponibilidad antes de ir al pago. Intenta nuevamente.");
        setChecking(false); // Detener carga en caso de error
      }
      // No ponemos setChecking(false) aquí porque la redirección ocurrirá si todo va bien
    };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <ShoppingCart size={24} />
        <h2>Carrito de compras</h2>
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
        {items.map((item) => {
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
        {!items.length && (
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
        <button
          type="button"
          className="btn primary checkout-btn"
          onClick={goToCheckout}
          disabled={checking || !items.length}
        >
          {checking ? 'Verificando...' : 'Finalizar Compra'}
        </button>
      </div>
    </div>
  );
};

export default Cart;
