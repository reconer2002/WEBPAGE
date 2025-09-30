# API de Productos - Backend

Este documento describe las rutas disponibles para la gestión de artículos, variantes y objetos (SKUs) en el sistema.

## Estructura de Base de Datos

### Tablas Principales:
- **articulos**: Productos principales con información básica
- **variantes**: Características variables de los productos (talla, color, etc.)
- **objeto**: SKUs específicos con stock y precio particular
- **objeto_variante**: Relación entre objetos y sus variantes

## Rutas Disponibles

### 🔹 Artículos

#### `GET /api/articulos`
Listar todos los artículos.
```json
Response: [
  {
    "id": 1,
    "nombre": "Camiseta Básica",
    "precio": 25.99,
    "descripcion": "Camiseta de algodón 100%",
    "foto": "https://example.com/camiseta.jpg",
    "descuento": 0,
    "ranking": 4.5
  }
]
```

#### `GET /api/articulos/{id}`
Obtener detalle de un artículo específico.

#### `POST /api/articulos`
Crear un artículo nuevo.
```json
Body: {
  "nombre": "Nuevo Producto",
  "precio": 49.99,
  "descripcion": "Descripción del producto",
  "foto": "url_imagen",
  "descuento": 10,
  "ranking": 0
}
```

#### `PUT /api/articulos/{id}`
Actualizar artículo existente.

#### `DELETE /api/articulos/{id}`
Eliminar artículo.

#### `POST /api/articulos/{id}/objetos/generar`
Generar todos los objetos posibles combinando las categorías especificadas.
```json
Body: {
  "categorias": ["Color", "Talla"],
  "precio_base": 25.99,
  "existencias_base": 10
}
```

### 🔹 Variantes

#### `GET /api/articulos/{id}/variantes`
Listar variantes de un artículo.
```json
Response: [
  {
    "id": 1,
    "articulo_id": 1,
    "nombre_categoria": "Talla",
    "valor": "M",
    "imagen": null
  }
]
```

#### `POST /api/articulos/{id}/variantes`
Crear variante en un artículo.
```json
Body: {
  "nombre_categoria": "Color",
  "valor": "Rojo",
  "imagen": "url_imagen_opcional"
}
```

#### `PUT /api/variantes/{id}`
Editar variante existente.

#### `DELETE /api/variantes/{id}`
Eliminar variante.

### 🔹 Objetos (SKUs)

#### `GET /api/articulos/{id}/objetos`
Listar SKUs de un artículo.
```json
Response: [
  {
    "id": 1,
    "articulo_id": 1,
    "existencias": 50,
    "precio": 25.99,
    "variantes": [
      {
        "id": 3,
        "nombre_categoria": "Talla",
        "valor": "M",
        "imagen": null
      },
      {
        "id": 6,
        "nombre_categoria": "Color",
        "valor": "Blanco",
        "imagen": "url_imagen"
      }
    ]
  }
]
```

#### `POST /api/articulos/{id}/objetos`
Crear un SKU manual.
```json
Body: {
  "existencias": 20,
  "precio": 25.99,
  "variante_ids": [3, 6]
}
```

#### `PUT /api/objetos/{id}`
Actualizar stock o precio de un SKU.
```json
Body: {
  "existencias": 30,
  "precio": 24.99
}
```

#### `DELETE /api/objetos/{id}`
Eliminar un SKU.

### 🔹 Objeto-Variante

#### `POST /api/objetos/{id}/variantes`
Asociar variantes a un SKU.
```json
Body: {
  "variante_ids": [3, 7]
}
```

#### `DELETE /api/objetos/{id}/variantes/{variante_id}`
Eliminar relación específica entre objeto y variante.

## Ejemplo de Flujo de Trabajo

1. **Crear un artículo**:
   ```
   POST /api/articulos
   ```

2. **Agregar variantes**:
   ```
   POST /api/articulos/1/variantes (Talla: S, M, L)
   POST /api/articulos/1/variantes (Color: Rojo, Azul, Verde)
   ```

3. **Generar todos los SKUs automáticamente**:
   ```
   POST /api/articulos/1/objetos/generar
   Body: { "categorias": ["Talla", "Color"] }
   ```
   Esto creará 9 objetos (3 tallas × 3 colores)

4. **O crear SKUs manualmente**:
   ```
   POST /api/articulos/1/objetos
   Body: { "variante_ids": [1, 4], "existencias": 20 }
   ```

## Consideraciones Técnicas

- Las relaciones entre tablas incluyen `ON DELETE CASCADE` para mantener integridad
- Los objetos pueden tener precios específicos diferentes al precio base del artículo
- Las variantes pueden incluir imágenes opcionales para visualización
- El sistema permite tanto creación manual como automática de SKUs
- Se valida la existencia de artículos y variantes antes de crear relaciones

## Datos de Ejemplo

El sistema incluye datos de ejemplo con:
- 4 artículos (Camiseta, Jeans, Zapatillas, Chaqueta)
- Variantes de talla y color para cada artículo
- Algunos objetos de ejemplo ya creados

Para regenerar la base de datos con datos de ejemplo, ejecutar:
```bash
python backend/sql/database.py
```