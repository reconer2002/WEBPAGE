
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

module.exports = router;