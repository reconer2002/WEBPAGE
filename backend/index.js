const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
require('dotenv').config();

// ✅ Configurar CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ✅ Middleware para JSON
// Aceptar payloads grandes (canvas base64) hasta 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ IMPORTAR dbSelector
const dbSelector = require('./middleware/dbSelector');

// ✅ Aplicarlo ANTES de las rutas
app.use(dbSelector);

// ✅ Rutas
const authRoutes = require('./routes/authemail');
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

const documentosRouter = require('./routes/documentos');
app.use('/api/documentos', documentosRouter);

const terminosRouter = require('./routes/terminos');
app.use("/api/terminos", terminosRouter);

const featuresRouter = require('./routes/features');
app.use('/api/features', featuresRouter);

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
app.listen(PORT, () => {});