const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();

// ✅ Middleware para JSON
app.use(express.json());

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

// ✅ Archivos estáticos
app.use('/img', express.static(path.join(__dirname, 'img')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));