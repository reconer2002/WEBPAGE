# Mentes Creativas — WIP de mejoras (esta rama)

Este documento resume, en detalle, todos los cambios realizados en esta rama para que puedas revisarlos, probarlos y/o integrarlos con seguridad. Incluye modificaciones en backend, frontend, servicios, configuración y notas de operación (BD de test, CORS, etc.).

## Resumen de objetivos
- Corregir “pantallas en blanco” y crasheos en “Tus Diseños Guardados”.
- Unificar el guardado de diseños y su agregado al carrito usando el backend real (no mock).
- Arreglar el carrito: cantidades reales, botón −, eliminar y stock demo consistente.
- Alinear rutas y middlewares del backend; exponer endpoints faltantes.
- Mejorar el registro de usuarios con los mismos campos que Perfil (nombre, apellido, teléfono, dirección, ciudad, región) y soporte en BD.
- Resolver problemas de CORS y límites de payload al capturar el canvas (imagen base64).
- Completar piezas faltantes del frontend (Register, VerifyAccount, Profile.css, proveedor de carrito).

---

## Backend

### 1) Montaje de rutas y middlewares (backend/index.js)
- Aumentado límite del body para aceptar imágenes base64 del canvas:
  - `app.use(express.json({ limit: '10mb' }));`
  - `app.use(express.urlencoded({ extended: true, limit: '10mb' }));`
- Aplica `dbSelector` para soportar entornos (prod/test) vía cabecera `x-entorno`.
- Migra suavemente columnas de perfil al iniciar (idempotente):
  - `ensureUserProfileSchema()` añade columnas si faltan: `apellido`, `telefono`, `direccion`, `ciudad`, `region` en `usuarios`.
- Monta rutas que faltaban (evita 404):
  - `/api/disenos` (routes/disenos)
  - `/api/cart` (routes/cart)
  - `/api/products` (routes/products)
- Estáticos con CORS para permitir captura de canvas sin “taint”:
  - `/img` con `Access-Control-Allow-Origin: *` y `Cross-Origin-Resource-Policy: cross-origin`.

### 2) Selección de BD y fallback seguro (backend/db.js)
- Exporta pool “prod” como default y añade `getDb(entorno)`.
- Fallback: `getDb('test')` solo usa test si `ENABLE_TEST_DB=true`; de lo contrario, usa prod. Evita `ER_BAD_DB_ERROR` cuando la BD de test no existe.

### 3) Autenticación y perfil (backend/routes/auth.js)
- Nuevo `POST /api/auth/register` (nombre, apellido, email, password, teléfono, dirección, ciudad, región):
  - Crea usuario rol “cliente” (crea el rol si falta).
  - Actualiza campos extendidos en `usuarios` si las columnas existen.
  - Devuelve `token` y mensaje.
- `GET /api/auth/me` expone también `apellido`, `telefono`, `direccion`, `ciudad`, `region` y permisos.
- `PUT /api/auth/me` permite actualizar los mismos campos (con validaciones básicas).

### 4) Diseños (backend/routes/disenos.js)
- `GET /api/disenos`:
  - Devuelve lista deduplicada por `(objeto_id, imagenes, textos)` (evita clones del carrito).
  - Excluye diseños “vacíos”.
- `POST /api/disenos`:
  - Recibe `{ nombre, articulo_id, imagen(base64), elementos, variantes }`.
  - Selecciona `objeto` del artículo por defecto; deriva textos desde `elementos`; guarda con costo (precio del objeto/artículo).

### 5) Carrito (backend/routes/cart.js)
- Cantidades reales sin clonar diseños (si existe columna `carrito_disenos.cantidad`):
  - Detección/creación automática de columna `cantidad`.
  - `POST /api/cart/items` incrementa `cantidad` por `designId`.
  - `PATCH /api/cart/items/:productId` consolida el grupo y ajusta `cantidad`.
  - `DELETE /api/cart/items/:productId` elimina la fila base y el grupo en modo sin `cantidad`.
  - `check-availability` y `checkout` usan `SUM(cantidad)`.
- Comparaciones JSON correctas (CAST) al eliminar/modificar.
- `DEMO_STOCK` consistente en todos los endpoints del carrito.

---

## Frontend

### 1) “Tus Diseños” y herramienta de diseño
- `src/components/Diseno/DisenosGuardados.jsx`
  - Arreglado crasheo al formatear fecha nula (tolerante a `Invalid Date`).
  - Correcciones de URLs de imagen y fallbacks.
- Diseño — versión “nueva”:
  - `HerramientaDiseñoNew.jsx` + hook `useHerramientaDiseño.js`.
  - Canvas y sidebar:
    - `components/Canvas/CanvasDiseño.jsx` usa `useImage(..., 'anonymous')` (evita “The operation is insecure”).
    - `components/Sidebar/SidebarDiseño.jsx` invoca `saveAndAddToCart` (backend) o, al menos, `onCaptureAndUploadViews`.
  - Hook `useHerramientaDiseño.js`:
    - Guarda diseño en backend (no mock): `disenosService.guardarDiseno({ nombre, articulo_id, imagen(base64), elementos, variantes })`.
    - Implementa `saveAndAddToCart`: guarda, luego `cartService.addItem({ id: articulo_id }, 1, { designId })`.
    - Oculta transformadores y captura el canvas en PNG base64 (restaura estado después).

### 2) Carrito (UI) y proveedor
- `src/App.jsx` ahora envuelve el árbol con `<CartProvider>` (evita errores y pantallas en blanco al usar `useCart`).
- `pages/Cart.jsx` y `services/cartService.js`:
  - Botón “−” decrece cantidad y elimina cuando llega a 0.
  - `removeItem`/`setQuantity` devuelven el carrito actual en caso de error (evita vaciar la UI por fallas).

### 3) Registro, verificación y perfil
- Registro: `src/components/LoginForm/Register.jsx` + `Register.css`.
  - Campos: nombre, apellido, email, contraseña, teléfono, dirección, ciudad, región.
  - “Región” es `<select>` con todas las regiones de Chile.
  - Tras registrar: guarda token y navega a inicio.
- Servicios de auth (completados): `src/services/authService.js`.
  - Añadidos: `register`, `updateProfile`, `sendVerificationEmail`, `verifyEmail`, `changePassword`.
  - `getCurrentUser` retorna `null` en 401 y borra token.
- Perfil: `src/pages/Profile.css` (estilos) y `src/pages/VerifyAccount.jsx` (simple).

### 4) Normalización de servicios y assets
- `articulosService.js` y `variantesService.js` usan `VITE_BACKEND_URL` para prefijar imágenes.
- Header usa icono importado para funcionar en build.

---

## Configuración y operación

### BD de test vs prod
- backend/.env:
  - `DB_NAME_PROD`, `DB_NAME_TEST` definen nombres de BD.
  - `ENABLE_TEST_DB=true` hace que `getDb('test')` use la BD de test cuando `dbSelector` detecta `x-entorno: test`.
- Crear BD de test y poblarla (ejemplos):
  - Crear: `CREATE DATABASE IF NOT EXISTS mentescreativasstore_test;`
  - Clonar desde prod: `mysqldump ... mentescreativasstore | mysql ... mentescreativasstore_test`
  - Importar dump del repo: `mysql ... mentescreativasstore_test < MentesCreativasStore-2.sql`

### Variables de entorno relevantes
- Backend: `JWT_SECRET`, `JWT_EXPIRES_IN`, `DEMO_STOCK`, `ENABLE_TEST_DB`.
- Frontend: `VITE_BACKEND_URL` (prefijo para `/img/...`), proxy `/api` en `vite.config.js` a `http://localhost:3000`.

---

## API efectiva (resumen)

- `POST /api/auth/register` → body: `{ nombre, apellido, email, password, telefono, direccion, ciudad, region }`.
- `GET /api/auth/me` → devuelve perfil extendido y permisos.
- `PUT /api/auth/me` → actualiza perfil (`nombre`, `email`, `telefono`, `direccion`, `ciudad`, `region`, `apellido`).

- `GET /api/disenos` → diseños del usuario (deduplicados).
- `POST /api/disenos` → `{ nombre, articulo_id, imagen, elementos, variantes }` → `{ id }`.

- `POST /api/cart/items` → `{ designId }` agrega o incrementa cantidad.
- `PATCH /api/cart/items/:productId` → `{ qty, designId }` ajusta cantidad.
- `DELETE /api/cart/items/:productId?designId=...` elimina ítem/grupo.
- `POST /api/cart/check-availability` valida stock; `POST /api/cart/checkout` descuenta existencias.

---

## Cómo probar

1) Backend
- `cd backend && node index.js` (o el script que uses).
- Verifica en logs que escuche en `:3000` y no falle al crear columnas.

2) Frontend
- `cd frontend && npm run dev`.
- Registro en `/register`. Debe crear cuenta, guardar token y redirigir.
- “Tus Diseños” (/disenos):
  - En Herramienta: crea un texto/imagen, “Guardar diseño” y “Guardar y agregar al carrito”.
  - Pestaña Guardados: debe listar el diseño recién creado.
- Carrito (/cart): incrementa/decrementa/elimina; “Comprobar disponibilidad” y “Finalizar compra”.

---

## Notas y consideraciones
- Para guardar diseños, el artículo debe tener al menos un `objeto` en BD.
- Si estás usando BD de test, asegúrate de que el backend apunte correctamente y que existan datos de `articulos/objetos`.
- Si ves “The operation is insecure” al capturar el canvas, revisa que `/img` esté expuesto con CORS (ya aplicado) y que `useImage(..., 'anonymous')` esté activo (ya aplicado).

---

## Lista (principal) de archivos modificados/añadidos

Backend
- `backend/index.js` (montaje de rutas, body limit, CORS, schema ensure)
- `backend/db.js` (fallback seguro test/prod)
- `backend/routes/disenos.js` (GET/POST dedupe + guardado real)
- `backend/routes/cart.js` (cantidades reales, checkout, delete y compare JSON, DEMO_STOCK)
- `backend/routes/auth.js` (register, me, update perfil)
- `backend/middleware/dbSelector.js` (usado por rutas)
- `backend/utils/schema.js` (ensureUserProfileSchema)

Frontend
- `src/components/Diseno/DisenosGuardados.jsx` (fix fecha nula)
- `src/components/Diseno/HerramientaDiseñoNew.jsx` (integra hook y sidebar)
- `src/components/Diseno/hooks/useHerramientaDiseño.js` (guardado backend + cart)
- `src/components/Diseno/components/Canvas/CanvasDiseño.jsx` (useImage anónimo)
- `src/components/Diseno/components/Sidebar/SidebarDiseño.jsx` (botón guarda+carrito)
- `src/App.jsx` (envuelve `<Routes>` con `<CartProvider>`)
- `src/context/CartContext.jsx` (usado por el árbol)
- `src/services/authService.js` (completado: register, updateProfile, etc.)
- `src/services/articulosService.js` / `variantesService.js` (usan `VITE_BACKEND_URL`)
- `src/components/LoginForm/Register.jsx` / `Register.css` (form reorganizado, select región)
- `src/pages/VerifyAccount.jsx` (simple)
- `src/pages/Profile.css` (estilos)

Si necesitas un changelog por commit o un plan de integración hacia otra rama, lo preparo a partir de esta lista.
