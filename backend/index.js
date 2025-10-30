const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();

// ✅ Middleware para JSON
// Aceptar payloads grandes (canvas base64) hasta 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ IMPORTAR dbSelector
const dbSelector = require('./middleware/dbSelector');

// ✅ Aplicarlo ANTES de las rutas
app.use(dbSelector);

// ✅ Rutas
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoutes);

const rolesRouter = require('./routes/roles');
app.use('/api/roles', rolesRouter);

const mantenedor = require('./routes/mantenedor');
app.use('/api/mantenedor', mantenedor);

const paginaRoutes = require('./routes/pagina');
app.use('/api/pagina', paginaRoutes);

const testimoniosRouter = require('./routes/testimonios');
app.use('/api/testimonios', testimoniosRouter);

const articulosRouter = require('./routes/articulos');
app.use('/api/articulos', articulosRouter);

const variantesRouter = require('./routes/variantes');
app.use('/api/variantes', variantesRouter);

const objetosRouter = require('./routes/objetos');
app.use('/api/objetos', objetosRouter);

const diseniosBaseRouter = require('./routes/disenios_base');
app.use('/api/disenios_base', diseniosBaseRouter);

// Rutas faltantes: disenos, cart y products
const disenosRouter = require('./routes/disenos');
app.use('/api/disenos', disenosRouter);

const cartRouter = require('./routes/cart');
app.use('/api/cart', cartRouter);

const productsRouter = require('./routes/products');
app.use('/api/products', productsRouter);

const estadisticasRouter = require('./routes/estadisticas');
app.use('/api/estadisticas', estadisticasRouter);

const checkoutRouter = require('./routes/checkout');
app.use('/api/checkout', checkoutRouter);

const pedidosRouter = require('./routes/pedidos');
app.use('/api/pedidos', pedidosRouter);

const enviosRouter = require('./routes/envios');
app.use('/api/envios', enviosRouter);

const terminosRouter = require('./routes/terminos');
app.use("/api/terminos", terminosRouter);

// ✅ Archivos estáticos con CORS para permitir captura del canvas
app.use(
  '/img',
  (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'img'))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

// Webhook para recibir eventos de Maileroo (bounces/deliveries)
try {
  const mailerooWebhook = require('./routes/maileroo_webhook');
  app.use('/webhook/maileroo', express.json(), mailerooWebhook);
  console.log('Maileroo webhook route mounted at /webhook/maileroo');
} catch (e) {
  console.warn('No se pudo montar webhook de Maileroo:', e && e.message ? e.message : e);
}