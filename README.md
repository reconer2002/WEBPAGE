Mentes Creativas Store — Backend y Esquema de Base de Datos (rama actual)

Este documento resume, de forma práctica, los cambios introducidos en esta rama, cómo funciona el backend y qué modificaciones se realizaron al esquema de datos para que todo el proyecto quede alineado.

Visión General

- Stack: Node.js (Express 5), MySQL (mysql2/promise).
- Autenticación: JWT con middleware de permisos por rol.
- Imágenes: subida con multer a backend/img y servido estático con CORS por /img.
- Esquema: se mantiene el “dump” histórico y se agregan migraciones suaves (idempotentes) para nuevas funcionalidades sin romper lo existente.

Configuración y Entorno

- Variables relevantes en backend/.env:
  - Conexión MySQL: DB_HOST, DB_USER, DB_PASS, DB_NAME_PROD, DB_NAME_TEST.
  - JWT: JWT_SECRET, JWT_EXPIRES_IN.
  - Otros:
    - PORT: puerto HTTP (por defecto 3000).
    - DEMO_STOCK: si se define, fuerza ese stock en respuestas (demo/sandbox).
    - BULK_RULES: reglas de descuento por cantidad (por ejemplo 3:10,4:15).
    - ENABLE_TEST_DB: habilita el uso de la base de test con el header x-entorno: test.
- Pool de conexiones (backend/db.js):
  - Crea dos pools (prod y test). Por compatibilidad, si x-entorno: test no está habilitado con ENABLE_TEST_DB=true, se usa prod.
  - Middleware dbSelector expone req.db para usar en rutas.

Migraciones suaves al inicio

- ensureUserProfileSchema (perfil de usuario):
  - Crea personas si no existe y añade columnas faltantes (telefono, ciudad, region, fecha_nacimiento), relajando NOT NULL donde corresponde.
  - Copia datos de usuarios → personas cuando hay columnas antiguas aún presentes.
- ensureCommerceSchema (comercio):
  - Crea pedidos, envios, disenos_pedido, envio_eventos si no existen.
  - Asegura carrito_disenos.cantidad y envios.tracking_url si faltan.
- Estas utilidades se ejecutan en backend/index.js al iniciar el servidor, y son idempotentes.

Backend — Estructura de Rutas

- Autenticación (/api/auth):
  - POST /register: crea usuario (rol cliente) y normaliza datos en personas.
  - POST /login: emite JWT.
  - GET /me: perfil + permisos por rol; incluye datos de personas.
  - PUT /me: actualiza datos básicos y normalizados.
- Usuarios (/api/usuarios): listados, cambio de rol, creación/edición/eliminación (requiere permisos moderar_usuarios).
- Roles y permisos (/api/roles): asignación y consulta de permisos disponibles por rol.
- Mantenedor (/api/mantenedor): categorías y subcategorías visibles según permisos.
- Página (/api/pagina): obtener/editar configuración y subir logo.
- Testimonios (/api/testimonios): CRUD protegido por permisos.
- Catálogo y variantes:
  - Artículos (/api/articulos): CRUD con subida de imagen.
  - Variantes (/api/variantes): edición/eliminación con imágenes.
  - Objetos (/api/objetos): combinaciones de variantes, stock y precio.
  - Diseños base (/api/disenios_base): recursos base para mockups.
- Diseños del usuario (/api/disenos):
  - Listado deduplicado por combinación objeto_id + JSON de elementos.
  - Obtener uno para edición (mapea JSON a elementos canvas).
  - Guardar/actualizar/eliminar, usando columnas normalizadas incluyendo elementos_por_vista.
- Productos (/api/products): expone articulos y stock (sumatoria de objetos) en formato de catálogo simple.
- Carrito (/api/cart):
  - Se apoya en tablas históricas carritos, carrito_disenos, disenos, objetos, articulos.
  - Asegura carrito_disenos.cantidad y agrupa ítems equivalentes por articulo/objeto/JSON.
  - Endpoints: listar, agregar por designId, ajustar cantidad, eliminar y comprobar disponibilidad.
  - BULK_RULES aplica descuentos por tramos si el artículo no define propios.
- Checkout (/api/checkout):
  - Estima envío para RM por comuna y fuera de RM por región.
  - POST /session: crea pedido en “pendiente” y emite token temporal para proveedor mock; actualiza costo con envío.
  - POST /mock/confirm: confirma/cancela, descuenta stock de objetos, vacía carrito, persiste disenos_pedido, genera boleta/factura (si corresponde) y crea envio + registro en envio_eventos.
- Pedidos (/api/pedidos): listado/admin con filtros y cambio de estado.
- Envíos (/api/envios):
  - GET /mios: envíos del usuario (incluye imagen representativa de disenos_pedido).
  - Admin: listar/actualizar y ver historial por envio_eventos.

Cambios Principales en la Base de Datos

Se parte del dump histórico y se añaden cambios que aseguran compatibilidad con el código actual. Puntos clave:

1) Nuevas tablas (si no existían)
- envios: seguimiento de entrega (método, dirección, comuna/ciudad/región, instrucciones, costo_envio, carrier, tracking, tracking_url, estado_envio, creado_en).
- envio_eventos: historial de estados por envío.
- disenos_pedido: snapshot de ítems del carrito en el momento de la compra (permite mostrar compras y envíos luego sin depender del carrito).

2) Tablas ajustadas
- disenos:
  - Se agrega elementos_por_vista (JSON) para soportar composiciones por vista (ej.: frente, espalda).
- personas:
  - Se relajan NOT NULL en nombre_real, apellido, fecha_nacimiento, direccion.
  - Se agregan telefono, ciudad, region (opcionales) para perfil normalizado.
- carrito_disenos:
  - Se asegura la columna cantidad (INT, por defecto 1). Si ya existe en el dump, se respeta.
- envios:
  - Se asegura la columna tracking_url si faltaba.

3) Idempotencia y compatibilidad
- El archivo MentesCreativasStore-4.sql incluye bloques que usan information_schema + SQL dinámico para crear columnas solo cuando faltan, evitando errores de ADD COLUMN IF NOT EXISTS en servidores que no soportan esa sintaxis.
- Las utilidades en backend/utils/schema.js realizan los mismos chequeos al iniciar el backend, por si la base aún no fue actualizada con el SQL.

Flujo de Compra (resumen)

1. Usuario inicia sesión (/api/auth/login) → obtiene JWT.
2. Crea/guarda diseños (/api/disenos) o agrega directo desde un artículo.
3. Agrega diseños al carrito (/api/cart/items o /api/cart/items-from-articulo).
4. Revisa carrito y disponibilidad.
5. Inicia checkout (/api/checkout/session) → crea pedido pendiente y calcula envío.
6. Confirma pago mock (/api/checkout/mock/confirm) → descuenta stock, limpia carrito, guarda snapshot (disenos_pedido), crea envio e historial.
7. El usuario puede ver sus envíos en /api/envios/mios.

Puesta en Marcha

1. Importa el esquema SQL (con los ajustes de esta rama):
   mysql -h 127.0.0.1 -u admin -p mentescreativasstore < MentesCreativasStore-4.sql
2. Configura backend/.env (DB, JWT, reglas de descuento y puerto).
3. Instala dependencias y corre el servidor:
   cd backend
   npm i
   npm run dev

Notas de Compatibilidad

- El backend mapea el catálogo “nuevo” a partir de tablas existentes (articulos + objetos) para mantener compatibilidad con el frontend.
- Si se opera con datos antiguos, las migraciones suaves añaden columnas/tablas faltantes sin borrar datos.
- ENABLE_TEST_DB=true + header x-entorno: test permite apuntar a la base DB_NAME_TEST sin tocar producción local.

Si necesitas una guía de endpoints más detallada (con ejemplos de request/response), indícalo y la agregamos como anexo a este README.
