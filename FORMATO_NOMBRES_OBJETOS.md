# Formato de Nombres de Objetos - Comparación

## Formato Anterior (HerramientaDiseño)
```javascript
// Formato simple usando valores directos
const nombreObjeto = objeto.variantes?.length > 0 
  ? objeto.variantes.map(v => v.valor).join(' - ')
  : `${objeto.articulo_nombre} (Básico)`;
```
**Ejemplo resultado:** `"Azul - Talla M - Algodón"`

## Formato Nuevo (Igual al Mantenedor)
```javascript
// Formato sofisticado usando mapeo por categorías
const mapVariantesObjeto = (objeto) => {
  const m = {};
  (objeto.variantes || []).forEach(v => {
    m[v.categoria] = { id: v.id, nombre: v.nombre || v.valor };
  });
  return m;
};

const generarNombreObjeto = (objeto) => {
  if (!objeto.variantes || objeto.variantes.length === 0) {
    return `${objeto.articulo_nombre} (Básico)`;
  }
  
  const variantesMap = mapVariantesObjeto(objeto);
  const categorias = [...new Set(objeto.variantes.map(v => v.categoria))];
  return categorias.map(cat => variantesMap[cat]?.nombre || "-").join(" - ");
};
```
**Ejemplo resultado:** `"Azul - Talla M - Algodón"`

## Diferencias Clave

1. **Agrupación por categorías**: El nuevo formato agrupa las variantes por categoría antes de generar el nombre
2. **Orden consistente**: Las categorías se ordenan de la misma forma que en el mantenedor
3. **Manejo de valores faltantes**: Si una categoría no tiene valor, muestra "-"
4. **Compatibilidad**: Usa exactamente la misma lógica que el mantenedor para mantener consistencia

## Estructura de Variantes Esperada

```javascript
objeto.variantes = [
  { id: 1, categoria: "color", valor: "Azul", nombre: "Azul" },
  { id: 2, categoria: "talla", valor: "M", nombre: "Talla M" },
  { id: 3, categoria: "material", valor: "Algodón", nombre: "Algodón" }
]
```

El resultado será: `"Azul - Talla M - Algodón"`

## Debug

Para ver cómo se están generando los nombres, puedes descomentar la línea de debug en la función `generarNombreObjeto()` en HerramientaDiseño.jsx:

```javascript
console.log('Objeto:', objeto.id, 'Categorías:', categorias, 'Variantes Map:', variantesMap, 'Nombre:', nombreGenerado);
```