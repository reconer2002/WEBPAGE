# Sistema Mock de Diseños Guardados

## Funcionalidades Implementadas

### 1. **Elementos Independientes por Vista**
- Cada vista (frontal, izquierda, derecha, trasera) mantiene sus propios elementos de diseño
- Los cambios en una vista no afectan a las otras
- Al cambiar de vista, se preservan los elementos añadidos anteriormente

### 2. **Servicio Mock de Diseños**
- `disenosMockService.js`: Simula el backend usando localStorage
- Guarda diseños con toda la información necesaria:
  - Nombre del diseño
  - Objeto/artículo seleccionado
  - Imagen capturada del canvas
  - Elementos de todas las vistas
  - Imágenes base de todas las vistas
  - Fecha de creación y modificación

### 3. **Funcionalidades del Mock**
- **Guardar diseño**: Captura el estado actual y lo almacena
- **Listar diseños**: Muestra todos los diseños guardados
- **Eliminar diseño**: Remueve un diseño específico
- **Limpiar todo**: Elimina todos los diseños (solo para desarrollo)

### 4. **Integración con la UI**
- **Herramienta de Diseño**: 
  - Botón "Guardar diseño" que captura y almacena el estado
  - Indicador de carga durante el guardado
  - Validación para asegurar que hay un objeto seleccionado
  
- **Diseños Guardados**:
  - Grid de tarjetas mostrando cada diseño
  - Información del diseño (nombre, artículo, precio, vista, fecha)
  - Botones para editar y eliminar
  - Recarga automática cuando se guarda un nuevo diseño

### 5. **Navegación Mejorada**
- Sistema de pestañas entre "Herramienta de Diseño" y "Diseños Guardados"
- Cambio automático a la pestaña de diseños guardados después de guardar
- Validación de permisos para acceder a diseños guardados

## Cómo Usar

1. **Crear un diseño**:
   - Ve a la pestaña "Herramienta de Diseño"
   - Selecciona un objeto de la lista
   - Añade elementos (texto, imágenes) en cualquier vista
   - Cambia entre vistas para añadir elementos específicos a cada una
   - Haz clic en "Guardar diseño"

2. **Ver diseños guardados**:
   - Ve a la pestaña "Diseños Guardados"
   - Verás una grid con todos tus diseños
   - Cada tarjeta muestra la imagen capturada y la información del diseño

3. **Gestionar diseños**:
   - Haz clic en "Eliminar" para borrar un diseño específico
   - Usa "Limpiar Todo (Dev)" para eliminar todos los diseños durante desarrollo

## Datos Almacenados

Cada diseño guardado contiene:
```javascript
{
  id: "timestamp",
  nombre: "Nombre del diseño",
  objeto_id: "ID del objeto",
  articulo_nombre: "Nombre del artículo",
  articulo_id: "ID del artículo", 
  precio: "Precio del objeto",
  imagen: "data:image/png;base64,...", // Imagen capturada
  vista_principal: "frente", // Vista desde la que se guardó
  elementos_por_vista: {
    frente: [elementos...],
    izquierda: [elementos...],
    derecha: [elementos...],
    detras: [elementos...]
  },
  imagenes_base: {
    frente: "url...",
    izquierda: "url...",
    derecha: "url...",
    detras: "url..."
  },
  variantes: [variantes...],
  fecha_creacion: "ISO string",
  fecha_modificacion: "ISO string"
}
```

## Persistencia

Los datos se almacenan en `localStorage` bajo la clave `disenos_guardados_mock`, lo que significa que:
- Los diseños persisten entre sesiones del navegador
- Los datos se mantienen hasta que se limpie el localStorage del navegador
- Cada navegador/dispositivo mantiene su propia colección de diseños

## Notas de Desarrollo

- El sistema está completamente en el frontend, no requiere backend
- La funcionalidad de "editar diseño" está marcada como pendiente (muestra alerta)
- El botón "Limpiar Todo" está incluido solo para facilitar las pruebas de desarrollo
- El sistema es extensible para agregar más funcionalidades como exportar, compartir, etc.