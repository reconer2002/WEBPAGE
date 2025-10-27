import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import checkoutService from '../services/checkoutService';
import cartService from '../services/cartService';
import authService from '../services/authService';
import './Checkout.css';
import { estimateShippingFront, getRMComunas, getChileRegions } from '../utils/shippingCL';

const Checkout = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', direccion: '', ciudad: '', region: '' });
  const [docType, setDocType] = useState('boleta');
  const [factura, setFactura] = useState({
    nombre_cliente: '', rut_cliente: '', giro: '', direccion: '', comuna: '', telefono: '', ciudad: '', referencia: ''
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [shipEstimate, setShipEstimate] = useState({ zone: null, price: 0 });
  const [shipping, setShipping] = useState({ metodo: 'delivery', instrucciones: '' });
  const onShipChange = (e) => setShipping((p) => ({ ...p, [e.target.name]: e.target.value }));

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
  const resolveImage = (u) => {
    const s = (u && String(u).trim()) || '';
    if (!s) return '';
    if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:')) return s;
    if (s.startsWith('/img/')) return `${BACKEND_URL}${s}`;
    return s;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const me = await authService.getCurrentUser();
        setUser(me || null);
        if (me) {
          setForm((prev) => ({
            ...prev,
            nombre: me.nombre || '',
            email: me.email || '',
            telefono: me.telefono || '',
            direccion: me.direccion || '',
            ciudad: me.ciudad || '',
            region: me.region || '',
          }));
        }
        const s = await checkoutService.getSummary();
        setSummary(s);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || 'No se pudo cargar el checkout');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totals = useMemo(() => summary?.totals || { base: 0, discount: 0, total: 0 }, [summary]);
  const grandTotal = useMemo(() => (Number(totals.total || 0) + (shipping.metodo==='delivery' ? Number(shipEstimate.price||0) : 0)), [totals.total, shipEstimate.price, shipping.metodo]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onFacturaChange = (e) => setFactura((p) => ({ ...p, [e.target.name]: e.target.value }));
  const [shipAddrMode, setShipAddrMode] = useState('perfil'); // 'perfil' | 'nueva'
  const [shipAddr, setShipAddr] = useState({ direccion: '', ciudad: '', region: '' });
  const REGIONES = useMemo(() => getChileRegions(), []);
  const RM_COMUNAS = useMemo(() => getRMComunas(), []);
  const onShipAddrChange = (e) => setShipAddr((p) => ({ ...p, [e.target.name]: e.target.value }));

  useEffect(() => {
    const comunaCandidate = shipAddrMode === 'nueva'
      ? (shipAddr.ciudad || (docType === 'factura' ? factura.comuna : form.ciudad))
      : (docType === 'factura' && factura.comuna ? factura.comuna : form.ciudad);
    const regionCandidate = shipAddrMode === 'nueva' ? (shipAddr.region || form.region) : form.region;
    const est = estimateShippingFront({ metodo: shipping.metodo, comuna: comunaCandidate, region: regionCandidate });
    setShipEstimate(est);
  }, [shipping.metodo, form.region, factura.comuna, form.ciudad, docType, shipAddrMode, shipAddr.ciudad, shipAddr.region]);

  // === Validaciones y máscaras ===
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const onlyDigits = (s) => String(s || '').replace(/\D+/g, '');
  const cleanRut = (s) => String(s || '').toUpperCase().replace(/\./g, '').replace(/-/g, '');
  const computeDv = (numStr) => {
    let sum = 0, mul = 2;
    for (let i = numStr.length - 1; i >= 0; i--) {
      sum += parseInt(numStr[i], 10) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const res = 11 - (sum % 11);
    if (res === 11) return '0';
    if (res === 10) return 'K';
    return String(res);
  };
  const validateRut = (rutRaw) => {
    const r = cleanRut(rutRaw);
    if (!r || r.length < 2) return false;
    const body = r.slice(0, -1).replace(/^0+/, '');
    const dv = r.slice(-1);
    if (!/^\d+$/.test(body)) return false;
    return computeDv(body) === dv;
  };
  const formatRut = (rutRaw) => {
    const r = cleanRut(rutRaw);
    if (!r) return '';
    const body = r.slice(0, -1).replace(/^0+/, '');
    const dv = r.slice(-1);
    if (!body) return dv;
    // agrupar miles con puntos
    const rev = body.split('').reverse().join('');
    const chunks = rev.match(/.{1,3}/g) || [];
    const withDots = chunks.map(c => c.split('').reverse().join('')).reverse().join('.');
    return `${withDots}-${dv}`;
  };
  const formatPhoneCL = (val) => {
    let d = onlyDigits(val);
    if (d.startsWith('56')) d = d.slice(2);
    if (d.length > 11) d = d.slice(0, 11);
    // Preferencia: +56 9 XXXX XXXX si móvil (9 dígitos empezando con 9)
    if (d.length === 9 && d[0] === '9') {
      return `+56 9 ${d.slice(1,5)} ${d.slice(5)}`;
    }
    if (d.length >= 8) {
      // Formato genérico +56 XX XXXX XXXX según largo
      const a = d.slice(0, 2);
      const b = d.slice(2, 6);
      const c = d.slice(6);
      return `+56 ${a} ${b}${c ? ' ' + c : ''}`.trim();
    }
    return d ? `+56 ${d}` : '';
  };

  const validateFactura = () => {
    const errs = {};
    if (!factura.nombre_cliente?.trim()) errs.nombre_cliente = 'Requerido';
    if (!validateRut(factura.rut_cliente)) errs.rut_cliente = 'RUT inválido';
    if (!factura.giro?.trim()) errs.giro = 'Requerido';
    if (!factura.direccion?.trim()) errs.direccion = 'Requerido';
    if (!factura.comuna?.trim()) errs.comuna = 'Requerido';
    if (!factura.ciudad?.trim()) errs.ciudad = 'Requerido';
    const phoneDigits = onlyDigits(factura.telefono);
    if (phoneDigits.length < 8) errs.telefono = 'Teléfono inválido';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    setCreating(true); setError(null);
    try {
      let payload = {};
      if (docType === 'boleta') {
        if (!emailRegex.test(form.email || '')) {
          setFieldErrors({ email: 'Email inválido' });
          setCreating(false);
          return;
        }
        payload = { docType: 'boleta', docData: { gmail: form.email } };
      } else if (docType === 'factura') {
        if (!validateFactura()) { setCreating(false); return; }
        payload = { docType: 'factura', docData: factura };
      }
      // Validación de dirección de envío nueva
      if (shipping.metodo === 'delivery' && shipAddrMode === 'nueva') {
        const errs = {};
        if (!shipAddr.direccion?.trim()) errs.ship_direccion = 'Ingresa una dirección';
        if (!shipAddr.ciudad?.trim()) errs.ship_ciudad = 'Ingresa una ciudad/comuna';
        if (!shipAddr.region?.trim()) errs.ship_region = 'Ingresa una región';
        if (Object.keys(errs).length) {
          setFieldErrors((prev) => ({ ...prev, ...errs }));
          setCreating(false);
          return;
        }
      }
      const comunaCandidate = shipAddrMode === 'nueva'
        ? (shipAddr.ciudad || (docType === 'factura' ? factura.comuna : form.ciudad))
        : (docType === 'factura' && factura.comuna ? factura.comuna : form.ciudad);
      const shipPayload = {
        metodo: shipping.metodo,
        receptor_nombre: form.nombre,
        receptor_telefono: form.telefono,
        direccion: shipAddrMode === 'nueva' ? (shipAddr.direccion || form.direccion) : form.direccion,
        comuna: comunaCandidate || '',
        ciudad: shipAddrMode === 'nueva' ? (shipAddr.ciudad || form.ciudad) : form.ciudad,
        region: shipAddrMode === 'nueva' ? (shipAddr.region || form.region) : form.region,
        instrucciones: shipping.instrucciones || ''
      };
      const session = await checkoutService.createSession({ ...payload, shipping: shipPayload });
      // Redireccionar a mock provider (o a la URL del gateway real)
      if (session?.redirectUrl) {
        window.location.href = session.redirectUrl;
      } else {
        setError('No se pudo iniciar el pago');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al iniciar el pago');
    }
    setCreating(false);
  };

  // Formateos onBlur
  const handleRutBlur = () => {
    if (factura.rut_cliente) {
      setFactura((p) => ({ ...p, rut_cliente: formatRut(p.rut_cliente) }));
    }
  };
  const handlePhoneBlur = () => {
    if (factura.telefono) setFactura((p) => ({ ...p, telefono: formatPhoneCL(p.telefono) }));
  };
  const handleContactPhoneBlur = () => {
    if (form.telefono) setForm((p) => ({ ...p, telefono: formatPhoneCL(p.telefono) }));
  };

  if (loading) return <div className="checkout-page"><div className="checkout-card">Cargando…</div></div>;
  if (error) return <div className="checkout-page"><div className="checkout-card error">{error}</div></div>;

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <h2>Finalizar compra</h2>
        <div className="checkout-grid">
          <section className="checkout-section">
            <div className="section-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Datos de contacto</h3>
              <button type="button" className="btn" onClick={() => navigate('/perfil')}>Editar</button>
            </div>
            <div className="form-grid">
              <label>
                <span>Nombre</span>
                <div className="readonly-input">{form.nombre || '-'}</div>
              </label>
              <label>
                <span>Email</span>
                <div className="readonly-input">{form.email || '-'}</div>
              </label>
              <label>
                <span>Teléfono</span>
                <div className="readonly-input">{form.telefono || '-'}</div>
              </label>
              <label className="full">
                <span>Dirección</span>
                <div className="readonly-input">{form.direccion || '-'}</div>
              </label>
              <label>
                <span>Ciudad</span>
                <div className="readonly-input">{form.ciudad || '-'}</div>
              </label>
              <label>
                <span>Región</span>
                <div className="readonly-input">{form.region || '-'}</div>
              </label>
            </div>

            <h3>Documento tributario</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <label><input type="radio" name="doctype" checked={docType==='boleta'} onChange={()=>setDocType('boleta')} /> Boleta</label>
              <label><input type="radio" name="doctype" checked={docType==='factura'} onChange={()=>setDocType('factura')} /> Factura</label>
            </div>

            {docType === 'boleta' ? (
              <div className="form-grid">
                <label className="full">
                  <span>Correo para boleta</span>
                  <input name="email" type="email" value={form.email} onChange={onChange} />
                </label>
                {fieldErrors.email && <small style={{ gridColumn: '1 / -1', color: '#b91c1c' }}>{fieldErrors.email}</small>}
                <small style={{ gridColumn: '1 / -1', color: '#64748b' }}>La boleta se emitirá con los datos de la tienda; usaremos tu correo para enviártela.</small>
              </div>
            ) : (
              <div className="form-grid">
                <label className="full">
                  <span>Razón social / Nombre cliente</span>
                  <input name="nombre_cliente" value={factura.nombre_cliente} onChange={onFacturaChange} required />
                  {fieldErrors.nombre_cliente && <small style={{ color: '#b91c1c' }}>{fieldErrors.nombre_cliente}</small>}
                </label>
                <label>
                  <span>RUT cliente</span>
                  <input name="rut_cliente" value={factura.rut_cliente} onChange={onFacturaChange} onBlur={handleRutBlur} required />
                  {fieldErrors.rut_cliente && <small style={{ color: '#b91c1c' }}>{fieldErrors.rut_cliente}</small>}
                </label>
                <label>
                  <span>Giro</span>
                  <input name="giro" value={factura.giro} onChange={onFacturaChange} required />
                  {fieldErrors.giro && <small style={{ color: '#b91c1c' }}>{fieldErrors.giro}</small>}
                </label>
                <label className="full">
                  <span>Dirección</span>
                  <input name="direccion" value={factura.direccion} onChange={onFacturaChange} required />
                  {fieldErrors.direccion && <small style={{ color: '#b91c1c' }}>{fieldErrors.direccion}</small>}
                </label>
                <label>
                  <span>Comuna</span>
                  <input name="comuna" value={factura.comuna} onChange={onFacturaChange} required />
                  {fieldErrors.comuna && <small style={{ color: '#b91c1c' }}>{fieldErrors.comuna}</small>}
                </label>
                <label>
                  <span>Ciudad</span>
                  <input name="ciudad" value={factura.ciudad} onChange={onFacturaChange} required />
                  {fieldErrors.ciudad && <small style={{ color: '#b91c1c' }}>{fieldErrors.ciudad}</small>}
                </label>
                <label>
                  <span>Teléfono</span>
                  <input name="telefono" value={factura.telefono} onChange={onFacturaChange} onBlur={handlePhoneBlur} required />
                  {fieldErrors.telefono && <small style={{ color: '#b91c1c' }}>{fieldErrors.telefono}</small>}
                </label>
                <label className="full"><span>Referencia (opcional)</span><input name="referencia" value={factura.referencia} onChange={onFacturaChange} /></label>
              </div>
            )}
          </section>

          <section className="checkout-section summary">
            <h3>Resumen de pago</h3>
            <div className="grand-total">
              <span className="label">Total a pagar</span>
              <span className="amount">${grandTotal.toLocaleString('es-CL')}</span>
            </div>
            <ul className="items">
              {(summary?.items || []).map((it, idx) => (
                <li key={idx} className="item">
                  <img src={resolveImage(it.image)} alt="" />
                  <div className="meta">
                    <div className="name">{it.name}</div>
                    <div className="qty">x{it.quantity}</div>
                  </div>
                  <div className="price">${Number(it.price * it.quantity).toLocaleString('es-CL')}</div>
                </li>
              ))}
            </ul>
            <div className="totals">
              <div className="row"><span>Subtotal</span><b>${Number(totals.base).toLocaleString('es-CL')}</b></div>
              <div className="row"><span>Descuento</span><b>-${Number(totals.discount).toLocaleString('es-CL')}</b></div>
              {shipping.metodo === 'delivery' && (
                <div className="row"><span>Envío</span><b>${Number(shipEstimate.price||0).toLocaleString('es-CL')}</b></div>
              )}
              <div className="row total"><span>Total</span><b>${grandTotal.toLocaleString('es-CL')}</b></div>
              {shipping.metodo === 'delivery' && (
                <small style={{ color: '#64748b' }}>El costo de envío se incluye en el total.</small>
              )}
            </div>
            <button className="pay-btn" onClick={handlePay} disabled={creating || !summary?.items?.length}>
              {creating ? 'Redirigiendo…' : `Pagar $${grandTotal.toLocaleString('es-CL')}`}
            </button>
          </section>
        </div>
        {/* Opciones de despacho al final, sin restricción de alto */}
        <div className="checkout-section" style={{ marginTop: 16 }}>
          <h3>Opciones de despacho</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <label><input type="radio" name="shipmethod" checked={shipping.metodo==='delivery'} onChange={()=>setShipping((p)=>({ ...p, metodo: 'delivery' }))} /> Despacho a domicilio</label>
            <label><input type="radio" name="shipmethod" checked={shipping.metodo==='retiro'} onChange={()=>setShipping((p)=>({ ...p, metodo: 'retiro' }))} /> Retiro en tienda</label>
          </div>
          {shipping.metodo === 'delivery' ? (
            <div className="form-grid" style={{ marginBottom: 10 }}>
              <div className="full" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label><input type="radio" name="shipaddrmode" checked={shipAddrMode==='perfil'} onChange={()=>setShipAddrMode('perfil')} /> Usar mi dirección del perfil</label>
                <label><input type="radio" name="shipaddrmode" checked={shipAddrMode==='nueva'} onChange={()=>setShipAddrMode('nueva')} /> Ingresar una dirección distinta</label>
              </div>
              {shipAddrMode === 'nueva' && (
                <>
                  <label className="full">
                    <span>Dirección de envío</span>
                    <input name="direccion" value={shipAddr.direccion} onChange={onShipAddrChange} placeholder="Calle 123, Depto 45" />
                  </label>
                  <label>
                    <span>Región</span>
                    <select name="region" value={shipAddr.region} onChange={onShipAddrChange}>
                      <option value="">Selecciona región</option>
                      {REGIONES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Comuna</span>
                    {String(shipAddr.region).toLowerCase().includes('metropolitana') ? (
                      <select name="ciudad" value={shipAddr.ciudad} onChange={onShipAddrChange}>
                        <option value="">Selecciona comuna</option>
                        {RM_COMUNAS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <select name="ciudad" value={shipAddr.ciudad} onChange={onShipAddrChange}>
                        <option value="">Otra comuna</option>
                      </select>
                    )}
                  </label>
                </>
              )}
              <label className="full">
                <span>Instrucciones</span>
                <input name="instrucciones" value={shipping.instrucciones} onChange={onShipChange} placeholder="Referencia, depto, horario, etc." />
              </label>
              <small className="full" style={{ color: '#64748b' }}>El cálculo de envío utiliza tu Ciudad/Región del perfil o la dirección de envío que indiques.</small>
            </div>
          ) : (
            <div className="form-grid" style={{ marginBottom: 10 }}>
              <small className="full" style={{ color: '#64748b' }}>Retiro en tienda: te enviaremos dirección y horario al confirmar el pago.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
