const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoutes);

const rolesRouter = require('./routes/roles');
app.use('/api/roles', rolesRouter);

const usuariosRolesRouter = require('./routes/usuariosRoles');
app.use('/api/usuarior', usuariosRolesRouter);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));