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
// ✅ Migraciones suaves para perfil de usuario (añade columnas si faltan)
const { ensureUserProfileSchema } = require('./utils/schema');

// ✅ Aplicarlo ANTES de las rutas
app.use(dbSelector);

// Asegurar columnas de perfil sin requerir bandera (idempotente)
ensureUserProfileSchema().catch((err) => {
  console.warn('No se pudo asegurar el esquema de usuarios:', err?.message);
});

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
