# Cambios Nuevos – Carrito de Compras (Frontend + Backend)

Este documento resume e instruye sobre todos los cambios nuevos agregados al proyecto para implementar el “Carrito de compras”.

## Resumen

- Frontend: se añadieron páginas de Catálogo (“Tus diseños”) y Carrito, servicios de productos/carrito, datos de ejemplo y un badge con el conteo de artículos en el icono del carrito.
- Backend: se añadieron rutas para productos y carrito, y un script SQL con tablas y semillas específicas del carrito. Nada de lo existente fue removido; solo se agregaron archivos y endpoints, y se montaron en el servidor.

## Archivos Nuevos y Modificados

### Frontend

- Nuevos (páginas y estilos)
  - `frontend/src/pages/Disenos.jsx`
  - `frontend/src/pages/Disenos.css`
  - `frontend/src/pages/Cart.jsx`
  - `frontend/src/pages/Cart.css`
- Nuevos (servicios y datos)
  - `frontend/src/services/productsService.js` (catálogo, búsqueda, inventario simulado)
  - `frontend/src/services/cartService.js` (carrito en localStorage, totales y eventos)
  - `frontend/public/products.json` (catálogo de ejemplo)
- Modificados
  - `frontend/src/App.jsx` (se añadieron rutas `/diseños` y `/cart`)
  - `frontend/src/components/Main/Header.jsx` (badge con contador del carrito)
  - `frontend/src/components/Main/Header.css` (estilos del badge del carrito)

### Backend

- Nuevos (rutas API)
  - `backend/routes/products.js` (listado/búsqueda, disponibilidad, batch de stock)
  - `backend/routes/cart.js` (CRUD de carrito por usuario, disponibilidad, checkout)
- Nuevo (SQL)
  - `backend/sql/cart.sql` (tablas: `products`, `product_inventory`, `carts`, `cart_items` + semillas)
- Modificado
  - `backend/index.js` (montar `/api/products` y `/api/cart`)
- Configuración (ya presente con valores de ejemplo)
  - `backend/.env` (PORT/DB/JWT – ajustar credenciales locales)

## Funcionalidad – Frontend

- Catálogo “Tus diseños” (`/diseños`)

  - Búsqueda por nombre.
  - Muestra precio, stock disponible y etiquetas de descuento:
    - Por producto: `discountPercent`.
    - Por volumen: `bulkDiscount` (min. unidades + %).
  - “Agregar al carrito” (valida stock simulado).

- Carrito (`/cart`)

  - Lista de artículos (imagen, precio, cantidad, disponibilidad, descuentos por línea y totales).
  - Eliminar diseño del carrito.
  - Modificar cantidad con +/- y validación de stock simulado.
  - “Comprobar disponibilidad” (todos los ítems).
  - “Finalizar compra” (descuenta stock simulado y limpia el carrito).

- Badge (contador) en el icono del carrito (Header)

  - Muestra el número total de unidades en el carrito.
  - Reacciona a cambios locales (evento `cart:updated`) y entre pestañas (evento `storage`).

- Persistencia local (simulada)
  - Carrito: `localStorage` clave `cart_v1`.
  - Inventario: `localStorage` clave `inventory_v1` (inicializado desde `frontend/public/products.json`).

## Funcionalidad – Backend

- Productos – `/api/products`

  - `GET /api/products?search=texto` → lista productos con stock y descuentos.
  - `GET /api/products/:id/availability?qty=3` → `{ available, stock }`.
  - `POST /api/products/stock-batch` → actualiza existencias en lote.
    - Body: `{ "updates": [ { "productId": 1, "delta": -2 }, ... ] }`
    - Requiere autenticación + permiso `editar_productos`.

- Carrito (por usuario autenticado) – `/api/cart`

  - `GET /api/cart` → items, stock actual y totales (base/discount/total).
  - `POST /api/cart/items` → agrega `{ productId, qty }`.
  - `PATCH /api/cart/items/:productId` → cambia `{ qty }`.
  - `DELETE /api/cart/items/:productId` → elimina diseño.
  - `POST /api/cart/check-availability` → comprueba disponibilidad completa.
  - `POST /api/cart/checkout` → transacción: comprueba stock, descuenta existencias y limpia carrito.

- Notas de seguridad
  - Todas las rutas de carrito requieren autenticación JWT.
  - El batch de stock requiere permiso `editar_productos`.

## Modelo de Datos (Carrito)

Incluido en `backend/sql/cart.sql`:

- `products (id, name, price, image, discount_percent, bulk_min_qty, bulk_percent)`
- `product_inventory (product_id, stock)` – FK a `products(id)`
- `carts (id, user_id, created_at)` – FK a `usuarios(id)`
- `cart_items (cart_id, product_id, quantity)` – PK compuesto y FKs a `carts` y `products`

Seeds: cuatro productos con existencias predeterminadas.

## Puesta en Marcha

1. Backend: base existente (si aún no está)

- Crear la base y tablas del proyecto principal usando los SQL existentes:
  - `backend/sql/database.sql` (ver nota de FKs: si da error de orden, desactivar FKs temporalmente)
  - `backend/sql/querys.sql`

2. Backend: tablas del carrito

- Cargar el nuevo script:
  - `mysql -u <USER> -p`
  - `USE mentescreativasstore;`
  - `SOURCE /ruta/completa/a/backend/sql/cart.sql;`

3. Variables de entorno (si no existen)

- `backend/.env` (editar con credenciales locales):

```
PORT=3000
DB_HOST=127.0.0.1
DB_USER=
DB_PASS=
DB_NAME=mentescreativasstore
JWT_SECRET=dev_super_secret_change_me
JWT_EXPIRES_IN=1d
```

4. Ejecutar backend

```
cd backend
npm install
npm run dev
```

5. Ejecutar frontend

```
cd frontend
npm install
npm run dev
```

- Recomendado para imágenes del backend en dev: `frontend/.env` con `VITE_BACKEND_URL=http://localhost:3000`.

## Pruebas Rápidas

- Productos (público):

```
curl "http://localhost:3000/api/products"
curl "http://localhost:3000/api/products?search=polera"
curl "http://localhost:3000/api/products/1/availability?qty=3"
```

- Login (para rutas protegidas):

```
curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identificador":"superadmin@gmail.com","password":"admin123"}'
```

Copiar `token` del JSON de respuesta.

- Carrito (con token):

```
TOKEN=... # pegar aquí
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/cart
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"productId":1,"qty":2}' http://localhost:3000/api/cart/items
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"qty":4}' http://localhost:3000/api/cart/items/1
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/cart/check-availability
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/cart/checkout
```

- Frontend:
  - `http://localhost:5173/diseños` → catálogo con búsqueda y “Agregar al carrito”.
  - `http://localhost:5173/cart` → carrito; probar +/- cantidad, eliminar, disponibilidad y finalizar compra.
  - Verificar el badge del carrito en el Header (contador de unidades).

## Consideraciones y Compatibilidad

- El frontend sigue funcionando “tal cual” con carrito e inventario locales (localStorage). Los nuevos endpoints del backend están disponibles para cuando se decida integrarlos (sin cambiar el diseño actual).
- El icono del carrito ahora muestra la suma de cantidades del carrito. Si se prefiere el número de ítems distintos, se puede ajustar en el servicio.
- Rutas existentes del proyecto (auth, usuarios, roles, página, testimonios, mantenedor) no fueron modificadas.
