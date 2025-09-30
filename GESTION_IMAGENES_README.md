# Gestión de Imágenes - Backend

Este documento explica cómo funciona el sistema de gestión de imágenes para artículos y variantes en el backend.

## 📁 Estructura de Carpetas

```
backend/
├── img/
│   ├── articulos/     # Imágenes de artículos
│   ├── variantes/     # Imágenes de variantes  
│   └── testimonios/   # Imágenes de testimonios (ya existía)
└── routes/
    ├── articulos.js   # Manejo de imágenes integrado
    ├── variantes.js   # Manejo de imágenes integrado
    └── testimonios.js # Patrón de referencia
```

## 🚀 Funcionalidades Implementadas

### **Artículos**
- ✅ Subir imagen al crear artículo (`POST /api/articulos`)
- ✅ Actualizar imagen al editar artículo (`PUT /api/articulos/:id`)
- ✅ Eliminar imagen automáticamente al borrar artículo (`DELETE /api/articulos/:id`)
- ✅ Reemplazar imagen anterior al subir una nueva

### **Variantes**
- ✅ Subir imagen al crear variante (`POST /api/articulos/:id/variantes`)
- ✅ Actualizar imagen al editar variante (`PUT /api/variantes/:id`)
- ✅ Eliminar imagen automáticamente al borrar variante (`DELETE /api/variantes/:id`)
- ✅ Reemplazar imagen anterior al subir una nueva

## 📋 Como Usar las APIs

### **Crear Artículo con Imagen**
```javascript
// Frontend - Usando FormData
const formData = new FormData();
formData.append('nombre', 'Mi Producto');
formData.append('precio', '29.99');
formData.append('descripcion', 'Descripción del producto');
formData.append('foto', fileInput.files[0]); // archivo de imagen

fetch('/api/articulos', {
  method: 'POST',
  body: formData // NO usar Content-Type: multipart/form-data se agrega automáticamente
});
```

### **Actualizar Artículo con Nueva Imagen**
```javascript
// Frontend - Solo enviar los campos que cambiarán
const formData = new FormData();
formData.append('nombre', 'Nuevo Nombre');
formData.append('foto', newImageFile); // nueva imagen (opcional)

fetch('/api/articulos/1', {
  method: 'PUT',
  body: formData
});
```

### **Crear Variante con Imagen**
```javascript
const formData = new FormData();
formData.append('nombre_categoria', 'Color');
formData.append('valor', 'Rojo');
formData.append('imagen', imageFile);

fetch('/api/articulos/1/variantes', {
  method: 'POST', 
  body: formData
});
```

## 🔧 Configuración Técnica

### **Configuración Técnica**

- **Tipos permitidos**: Todos los tipos de archivo (sin validación específica)
- **Nombres automáticos**: `articulo-{timestamp}.ext` o `variante-{timestamp}.ext`
- **Patrón**: Siguiendo el mismo estilo que `testimonios.js`

### **Gestión Automática**
- **Eliminación**: Las imágenes se eliminan automáticamente del servidor cuando:
  - Se elimina el artículo/variante
  - Se reemplaza por una nueva imagen
- **Rutas**: Las imágenes se sirven estáticamente desde `/img/...`

## 📝 Ejemplos de Respuesta

### **Artículo Creado**
```json
{
  "id": 1,
  "nombre": "Camiseta Premium",
  "precio": "29.99",
  "descripcion": "Camiseta de alta calidad",
  "foto": "/img/articulos/articulo-1640995200000.jpg",
  "descuento": "0.00",
  "ranking": "0.00"
}
```

### **Variante Creada**
```json
{
  "id": 5,
  "articulo_id": 1,
  "nombre_categoria": "Color",
  "valor": "Rojo",
  "imagen": "/img/variantes/variante-1640995300000.png"
}
```

## 🛠 Mantenimiento

### **Limpieza Manual**
Si necesitas limpiar imágenes huérfanas:
```bash
# Navegar a la carpeta del backend
cd backend/img/articulos
# Ver archivos
ls -la
# Eliminar archivos específicos si es necesario
rm archivo-especifico.jpg
```

### **Backup de Imágenes**
Las imágenes se almacenan en:
- `backend/img/articulos/`
- `backend/img/variantes/`
- `backend/img/testimonios/`

Asegúrate de incluir estas carpetas en tus backups.

## 🔍 Debugging

### **Errores Comunes**
1. **"No se pudo eliminar la imagen"**: Permisos de archivo o imagen ya eliminada
2. **Error de subida**: Verificar que el campo del formulario coincida (`foto` para artículos, `imagen` para variantes)
3. **Ruta no encontrada**: Verificar que las carpetas `img/articulos` e `img/variantes` existan

### **Logs**
El sistema registra en consola:
- ⚠️ `No se pudo eliminar la imagen anterior: [detalles]`
- ⚠️ `No se pudo eliminar la imagen: [detalles]`

## 🔮 Próximas Mejoras

- [ ] Optimización automática de imágenes (resize, compresión)
- [ ] Soporte para múltiples imágenes por artículo
- [ ] Validación de dimensiones mínimas/máximas
- [ ] Integración con CDN para mejor rendimiento