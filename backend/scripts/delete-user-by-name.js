// Delete a user from DB by id, name+lastname, full name or email
// Usage examples:
//   node backend/scripts/delete-user-by-name.js --name "Juan" --lastname "Pablo"
//   node backend/scripts/delete-user-by-name.js --name "Juan Pablo"
//   node backend/scripts/delete-user-by-name.js --email "juan@example.com"
//   node backend/scripts/delete-user-by-name.js --id 42

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");

function getArg(key) {
  const argv = process.argv.slice(2);
  const i = argv.findIndex((a) => a === `--${key}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  const pref = `--${key}=`;
  const m = argv.find((a) => a.startsWith(pref));
  if (m) return m.slice(pref.length);
  return null;
}

function usage(msg) {
  if (msg) console.error("\n" + msg + "\n");
  console.log(`
Eliminar usuario de la tabla 'usuarios'.

Parámetros:
  --id <id>                   Eliminar por ID exacto
  --email <email>             Eliminar por email exacto
  --name <nombre>             Nombre (puede incluir nombre y apellido juntos)
  --lastname <apellido>       Apellido (opcional; usar con --name)

Ejemplos:
  node backend/scripts/delete-user-by-name.js --id 42
  node backend/scripts/delete-user-by-name.js --email juan@example.com
  node backend/scripts/delete-user-by-name.js --name "Juan" --lastname "Pablo"
  node backend/scripts/delete-user-by-name.js --name "Juan Pablo"
`);
  process.exit(msg ? 1 : 0);
}

(async () => {
  const id = getArg("id");
  const email = getArg("email");
  const name = getArg("name");
  const lastname = getArg("lastname");

  if (!id && !email && !name) {
    usage("Debes indicar --id, --email o --name");
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    if (id) {
      const userId = parseInt(id, 10);
      if (!Number.isInteger(userId) || userId <= 0) {
        return usage("--id debe ser un entero positivo");
      }
      const [[u]] = await conn.query(
        "SELECT id, nombre, apellido, email FROM usuarios WHERE id = ?",
        [userId]
      );
      if (!u) return usage(`No existe usuario con id=${userId}`);

      const [res] = await conn.query("DELETE FROM usuarios WHERE id = ?", [
        userId,
      ]);
      console.log(
        `Eliminado id=${userId} nombre=${u.nombre || ""} ${
          u.apellido || ""
        } email=${u.email || ""} (filas afectadas: ${res.affectedRows})`
      );
      return;
    }

    // Buscar coincidencias por email/nombre
    const conds = [];
    const params = [];
    if (email) {
      conds.push("email = ?");
      params.push(email);
    }
    if (name && lastname) {
      conds.push("(nombre = ? AND apellido = ?)");
      params.push(name, lastname);
    } else if (name) {
      conds.push(
        "(nombre = ? OR CONCAT(TRIM(nombre), ' ', TRIM(COALESCE(apellido,''))) = ?)"
      );
      params.push(name, name);
    }

    const [rows] = await conn.query(
      `SELECT id, nombre, apellido, email FROM usuarios WHERE ${conds.join(
        " OR "
      )} ORDER BY id`,
      params
    );

    if (rows.length === 0) {
      return usage("No se encontraron usuarios con esos criterios");
    }
    if (rows.length > 1) {
      console.log("Se encontraron múltiples usuarios. Especifica --id:");
      rows.forEach((r) =>
        console.log(
          `  id=${r.id}  nombre=${r.nombre || ""} ${r.apellido || ""}  email=$
{r.email || ""}`
        )
      );
      process.exit(1);
    }

    const u = rows[0];
    const [res] = await conn.query("DELETE FROM usuarios WHERE id = ?", [u.id]);
    console.log(
      `Eliminado id=${u.id} nombre=${u.nombre || ""} ${u.apellido || ""} email=${
        u.email || ""
      } (filas afectadas: ${res.affectedRows})`
    );
  } catch (err) {
    console.error("Error eliminando usuario:", err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();

