const express = require("express");
const path = require("path");
const app = express();
require("dotenv").config();
const { ensureUserProfileSchema, ensureCartSchema } = require("./utils/schema");

app.use(express.json());

// Evitar migraciones automáticas salvo que se habiliten explícitamente
if (String(process.env.MIGRATE_SCHEMA).toLowerCase() === 'true') {
  ensureUserProfileSchema().catch((err) => {
    console.warn("No se pudo asegurar el esquema de usuarios:", err?.message);
  });
  ensureCartSchema().catch((err) => {
    console.warn("No se pudo asegurar el esquema de carrito:", err?.message);
  });
}

// Rutas
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const usuariosRoutes = require("./routes/usuarios");
app.use("/api/usuarios", usuariosRoutes);

const rolesRouter = require("./routes/roles");
app.use("/api/roles", rolesRouter);

const mantenedor = require("./routes/mantenedor");
app.use("/api/mantenedor", mantenedor);

const paginaRoutes = require("./routes/pagina");
app.use("/api/pagina", paginaRoutes);

const testimoniosRouter = require("./routes/testimonios");
app.use("/api/testimonios", testimoniosRouter);

const articulosRouter = require("./routes/articulos");
app.use("/api/articulos", articulosRouter);

const variantesRouter = require("./routes/variantes");
app.use("/api/variantes", variantesRouter);

const objetosRouter = require("./routes/objetos");
app.use("/api/objetos", objetosRouter);

const cartRouter = require("./routes/cart");
app.use("/api/cart", cartRouter);

const disenosRouter = require("./routes/disenos");
app.use("/api/disenos", disenosRouter);
const productsRouter = require("./routes/products");
app.use("/api/products", productsRouter);

// Estáticos con CORS para permitir captura de canvas sin taint
app.use(
  "/img",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Evita bloqueos por CORP en navegadores modernos cuando se usa desde otro puerto
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "img"))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
