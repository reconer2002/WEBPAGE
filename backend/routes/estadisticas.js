
const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth"); 
const verifyPermiso = require('../middleware/permisos');
const dbSelector = require('../middleware/dbSelector');

// Aplica middlewares a todas las rutas en este router
router.use(verifyToken, verifyPermiso('ver_informes'), dbSelector);

// ===================================================================
// 1. ENDPOINT GENERAL: /api/estadisticas
//    (Estadísticas de Usuarios y Rankings)
// ===================================================================
router.get("/", async (req, res) => {
  try {
    // 1. Cantidad total de usuarios
    const [usuariosResult] = await req.db.execute(
      'SELECT COUNT(*) AS totalUsuarios FROM usuarios'
    );
    const totalUsuarios = usuariosResult[0].totalUsuarios;

    // 2. Cantidad total de pedidos
    const [pedidosResult] = await req.db.execute(
      'SELECT COUNT(*) AS totalPedidos FROM pedidos'
    );
    const totalPedidos = pedidosResult[0].totalPedidos;

    // 3. Conteo de usuarios por rol (Gráfico Circular)
    const [usuariosPorRol] = await req.db.execute(`
      SELECT r.nombre AS rol, COUNT(u.id) AS cantidad
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      GROUP BY r.nombre
      ORDER BY cantidad DESC
    `);
    
    // --- RANKINGS ---
    
    // 4. Ranking de usuarios con más dinero gastado
    const [rankingDineroGastado] = await req.db.execute(`
      SELECT 
          u.id, 
          u.nombre, 
          COALESCE(SUM(p.costo), 0) AS totalGastado
      FROM usuarios u
      LEFT JOIN pedidos p ON u.id = p.usuario_id AND p.estado = 'pagado'
      GROUP BY u.id, u.nombre
      ORDER BY totalGastado DESC
      LIMIT 10;
    `);
    
    // 5. Ranking de usuarios con más pedidos hechos
    const [rankingMasPedidos] = await req.db.execute(`
      SELECT 
          u.id, 
          u.nombre, 
          COUNT(p.id) AS totalPedidos
      FROM usuarios u
      LEFT JOIN pedidos p ON u.id = p.usuario_id
      GROUP BY u.id, u.nombre
      ORDER BY totalPedidos DESC
      LIMIT 10;
    `);

    // 6. Ranking de usuarios con más diseños generados
    const [rankingMasDisenos] = await req.db.execute(`
        SELECT 
            u.id,
            u.nombre,
            (
                SELECT COUNT(d.id) FROM disenos d WHERE d.usuario_id = u.id
            ) 
            + 
            (
                SELECT COUNT(dp.id) FROM disenos_pedido dp WHERE dp.usuario_id = u.id
            ) AS totalDisenos
        FROM usuarios u
        ORDER BY totalDisenos DESC
        LIMIT 10;
    `);

    const estadisticas = {
      totalUsuarios: totalUsuarios,
      totalPedidos: totalPedidos,
      usuariosPorRol: usuariosPorRol,
      rankingDineroGastado: rankingDineroGastado,
      rankingMasPedidos: rankingMasPedidos,
      rankingMasDisenos: rankingMasDisenos,
    };

    res.json(estadisticas);
  } catch (error) {
    console.error("Error al obtener estadísticas generales:", error);
    res.status(500).json({ error: "Error al obtener estadísticas generales" });
  }
});

// ===================================================================
// 2. ENDPOINT DE ARTÍCULOS: /api/estadisticas/articulos
//    (Resumen y Grid de Artículos)
// ===================================================================

router.get("/articulos", async (req, res) => {
  try {
    // 1. Cantidad total de artículos
    const [totalArticulosResult] = await req.db.execute(
      'SELECT COUNT(*) AS totalArticulos FROM articulos'
    );
    const totalArticulos = totalArticulosResult[0].totalArticulos;

    // 2. Cantidad total de variantes
    const [totalVariantesResult] = await req.db.execute(
      'SELECT COUNT(*) AS totalVariantes FROM variantes'
    );
    const totalVariantes = totalVariantesResult[0].totalVariantes;

    // 3. Cantidad total de diseños (activos en carrito + comprados en disenos_pedido)
    const [totalDisenosResult] = await req.db.execute(`
      SELECT 
          (SELECT COUNT(*) FROM disenos) + 
          (SELECT COUNT(*) FROM disenos_pedido) AS totalDisenos
    `);
    const totalDisenos = totalDisenosResult[0].totalDisenos;

    // 4. Obtener la lista de artículos para el grid (incluye 'foto' para el frontend)
    const [listaArticulos] = await req.db.execute(
      'SELECT id, nombre, precio, foto FROM articulos ORDER BY id ASC'
    );

    const estadisticasArticulos = {
      totalArticulos: totalArticulos,
      totalVariantes: totalVariantes,
      totalDisenos: totalDisenos,
      listaArticulos: listaArticulos,
    };

    res.json(estadisticasArticulos);
  } catch (error) {
    console.error("Error al obtener estadísticas de artículos:", error);
    res.status(500).json({ error: "Error al obtener estadísticas de artículos" });
  }
});


// ===================================================================
// 3. ENDPOINT DE DETALLE: /api/estadisticas/articulos/:articuloId/variantes-disenos
//    (Gráfico Circular por Categoría de Variante)
// ===================================================================

router.get("/articulos/:articuloId/variantes-disenos", async (req, res) => {
  const { articuloId } = req.params;

  try {
    // Consulta para obtener el conteo de diseños por variante de un artículo.
    const [disenosPorVariante] = await req.db.execute(`
        SELECT 
            v.nombre_categoria, 
            v.valor,
            COUNT(DISTINCT d.id) AS diseños_activos,
            COUNT(DISTINCT dp.id) AS diseños_comprados,
            (
                COUNT(DISTINCT d.id) + COUNT(DISTINCT dp.id)
            ) AS total_disenos
        FROM variantes v
        -- 1. Unir con objetos que tienen esa variante
        INNER JOIN objeto_variante ov ON v.id = ov.variante_id
        INNER JOIN objetos o ON ov.objeto_id = o.id
        -- 2. Contar diseños activos asociados a esos objetos
        LEFT JOIN disenos d ON o.id = d.objeto_id AND v.articulo_id = o.articulo_id
        -- 3. Contar diseños comprados asociados a esos objetos
        LEFT JOIN disenos_pedido dp ON o.id = dp.objeto_id AND v.articulo_id = o.articulo_id
        WHERE v.articulo_id = ? 
        GROUP BY v.id, v.nombre_categoria, v.valor
        HAVING total_disenos > 0
        ORDER BY v.nombre_categoria, total_disenos DESC;
    `, [articuloId]);

    res.json(disenosPorVariante);
  } catch (error) {
    console.error(`Error al obtener diseños por variante para artículo ${articuloId}:`, error);
    res.status(500).json({ error: "Error al obtener datos de variantes." });
  }
});

// ===================================================================
// 4. ENDPOINT DE RANKING DE PRODUCTOS: /api/estadisticas/productos/ranking
//    (Objetos más vendidos y sus métricas)
// ===================================================================

router.get("/productos/ranking", async (req, res) => {
  try {
    // Ranking de objetos más vendidos
    const [rankingVentas] = await req.db.execute(`
      SELECT 
        o.id,
        a.nombre AS nombre_articulo,
        a.precio,
        a.foto,
        GROUP_CONCAT(DISTINCT CONCAT(v.nombre_categoria, ': ', v.valor) ORDER BY v.nombre_categoria SEPARATOR ', ') AS variantes,
        COUNT(DISTINCT dp.id) AS total_unidades_vendidas,
        COUNT(DISTINCT dp.pedido_id) AS total_pedidos,
        SUM(a.precio) AS ingresos_totales,
        COUNT(DISTINCT dp.usuario_id) AS clientes_unicos
      FROM objetos o
      INNER JOIN articulos a ON o.articulo_id = a.id
      INNER JOIN objeto_variante ov ON o.id = ov.objeto_id
      INNER JOIN variantes v ON ov.variante_id = v.id
      INNER JOIN disenos_pedido dp ON o.id = dp.objeto_id
      INNER JOIN pedidos p ON dp.pedido_id = p.id
      WHERE p.estado = 'pagado'
      GROUP BY o.id, a.nombre, a.precio, a.foto
      ORDER BY total_unidades_vendidas DESC
      LIMIT 20
    `);

    // Objetos sin ventas (para referencia)
    const [productosSinVentas] = await req.db.execute(`
      SELECT 
        o.id,
        a.nombre AS nombre_articulo,
        a.precio,
        a.foto,
        GROUP_CONCAT(DISTINCT CONCAT(v.nombre_categoria, ': ', v.valor) ORDER BY v.nombre_categoria SEPARATOR ', ') AS variantes
      FROM objetos o
      INNER JOIN articulos a ON o.articulo_id = a.id
      INNER JOIN objeto_variante ov ON o.id = ov.objeto_id
      INNER JOIN variantes v ON ov.variante_id = v.id
      LEFT JOIN disenos_pedido dp ON o.id = dp.objeto_id AND dp.pedido_id IN (
        SELECT id FROM pedidos WHERE estado = 'pagado'
      )
      WHERE dp.id IS NULL
      GROUP BY o.id, a.nombre, a.precio, a.foto
    `);

    // Métricas generales
    const [metricas] = await req.db.execute(`
      SELECT 
        COUNT(DISTINCT dp.id) AS total_productos_vendidos,
        SUM(a.precio) AS ingresos_totales_global,
        COUNT(DISTINCT p.id) AS total_pedidos_completados,
        COUNT(DISTINCT dp.usuario_id) AS total_clientes
      FROM disenos_pedido dp
      INNER JOIN objetos o ON dp.objeto_id = o.id
      INNER JOIN articulos a ON o.articulo_id = a.id
      INNER JOIN pedidos p ON dp.pedido_id = p.id
      WHERE p.estado = 'pagado'
    `);

    res.json({
      rankingVentas,
      productosSinVentas,
      metricas: metricas[0] || {
        total_productos_vendidos: 0,
        ingresos_totales_global: 0,
        total_pedidos_completados: 0,
        total_clientes: 0
      }
    });
  } catch (error) {
    console.error("Error al obtener ranking de productos:", error);
    res.status(500).json({ error: "Error al obtener ranking de productos" });
  }
});

// ===================================================================
// 5. ENDPOINT DE DETALLE DE PRODUCTO: /api/estadisticas/productos/:productoId/detalle
//    (Métricas detalladas de un objeto específico)
// ===================================================================

router.get("/productos/:productoId/detalle", async (req, res) => {
  const { productoId } = req.params;

  try {
    // Información básica del objeto
    const [infoProducto] = await req.db.execute(`
      SELECT 
        o.id, 
        a.nombre AS nombre_articulo,
        a.precio, 
        a.foto, 
        a.descripcion,
        GROUP_CONCAT(DISTINCT CONCAT(v.nombre_categoria, ': ', v.valor) ORDER BY v.nombre_categoria SEPARATOR ', ') AS variantes
      FROM objetos o
      INNER JOIN articulos a ON o.articulo_id = a.id
      INNER JOIN objeto_variante ov ON o.id = ov.objeto_id
      INNER JOIN variantes v ON ov.variante_id = v.id
      WHERE o.id = ?
      GROUP BY o.id, a.nombre, a.precio, a.foto, a.descripcion
    `, [productoId]);

    if (infoProducto.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Métricas de ventas del objeto
    const [metricasVentas] = await req.db.execute(`
      SELECT 
        COUNT(DISTINCT dp.id) AS unidades_vendidas,
        COUNT(DISTINCT dp.pedido_id) AS pedidos_totales,
        SUM(a.precio) AS ingresos_totales,
        COUNT(DISTINCT dp.usuario_id) AS clientes_unicos,
        AVG(a.precio) AS precio_promedio
      FROM objetos o
      INNER JOIN articulos a ON o.articulo_id = a.id
      INNER JOIN disenos_pedido dp ON o.id = dp.objeto_id
      INNER JOIN pedidos p ON dp.pedido_id = p.id
      WHERE o.id = ? AND p.estado = 'pagado'
    `, [productoId]);

    // Distribución de ventas por mes (últimos 6 meses)
    const [ventasPorMes] = await req.db.execute(`
      SELECT 
        DATE_FORMAT(p.fecha, '%Y-%m') AS mes,
        COUNT(DISTINCT dp.id) AS unidades_vendidas,
        SUM(a.precio) AS ingresos
      FROM objetos o
      INNER JOIN articulos a ON o.articulo_id = a.id
      INNER JOIN disenos_pedido dp ON o.id = dp.objeto_id
      INNER JOIN pedidos p ON dp.pedido_id = p.id
      WHERE o.id = ? 
        AND p.estado = 'pagado'
        AND p.fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes DESC
    `, [productoId]);

    // Top clientes del objeto
    const [topClientes] = await req.db.execute(`
      SELECT 
        u.nombre,
        u.email,
        COUNT(DISTINCT dp.id) AS cantidad_comprada,
        SUM(a.precio) AS total_gastado
      FROM usuarios u
      INNER JOIN disenos_pedido dp ON u.id = dp.usuario_id
      INNER JOIN objetos o ON dp.objeto_id = o.id
      INNER JOIN articulos a ON o.articulo_id = a.id
      INNER JOIN pedidos p ON dp.pedido_id = p.id
      WHERE o.id = ? AND p.estado = 'pagado'
      GROUP BY u.id, u.nombre, u.email
      ORDER BY cantidad_comprada DESC
      LIMIT 5
    `, [productoId]);

    res.json({
      producto: infoProducto[0],
      metricas: metricasVentas[0] || {
        unidades_vendidas: 0,
        pedidos_totales: 0,
        ingresos_totales: 0,
        clientes_unicos: 0,
        precio_promedio: 0
      },
      ventasPorMes,
      topClientes
    });
  } catch (error) {
    console.error(`Error al obtener detalle del producto ${productoId}:`, error);
    res.status(500).json({ error: "Error al obtener detalle del producto" });
  }
});

module.exports = router;