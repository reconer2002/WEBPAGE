import mysql.connector
from mysql.connector import Error
import os

# Credenciales para MySQL (ajusta según tu entorno o usa variables de entorno)
MYSQL_HOST = "localhost"
MYSQL_USER = "root"
MYSQL_PASSWORD = "1234"

# Rutas a los archivos SQL que contienen la creación de tablas y datos
SQL_DATABASE_FILE = os.path.join('backend', 'sql', 'database.sql')
SQL_QUERYS_FILE = os.path.join('backend', 'sql', 'querys.sql')
SQL_DATOS_EJEMPLO = os.path.join('backend', 'sql', 'datos_ejemplo.sql')
SQL_PRODUCT_TABLES = os.path.join('backend', 'sql', 'product_tables.sql')

def read_sql_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return None

def normalize_sql_for_connector(sql_text: str) -> str:
    """Remove DELIMITER directives and convert $$-delimited blocks into normal SQL
    so mysql-connector's multi execution can handle procedures.
    This is a best-effort transformation: it looks for patterns like
    DELIMITER $$ ... END $$ DELIMITER ; and converts to ... END;"""
    if not sql_text:
        return sql_text

    # Remove lines that set DELIMITER (e.g., DELIMITER $$ or DELIMITER ;)
    lines = [ln for ln in sql_text.splitlines() if not ln.strip().upper().startswith('DELIMITER')]
    normalized = '\n'.join(lines)

    # Convert END $$ (with possible spaces) into END;
    normalized = normalized.replace('END $$', 'END;')
    normalized = normalized.replace('END$$', 'END;')
    # If any $$ tokens remain (start/end markers), remove them
    normalized = normalized.replace('$$', '')

    # Clean up stray double semicolons or blank semicolon lines
    normalized = normalized.replace('\n;\n', '\n')
    return normalized

def ejecutar_sql_multi(cursor, sql_script):
  # Ejecuta un script SQL que puede contener múltiples sentencias y procedimientos.
  # Usamos cursor.execute(..., multi=True) para que mysql-connector maneje correctamente
  # bloques como CREATE PROCEDURE que contienen ';' internos.
  try:
    for result in cursor.execute(sql_script, multi=True):
      # Algunos resultados pueden ser objetos con .statement o .rowcount
      try:
        _ = result.fetchall()
      except Exception:
        # No todas las sentencias retornan filas; ignorar
        pass
  except Exception as e:
    # Imprimir el SQL truncado en caso de error para diagnóstico
    preview = sql_script.strip().split('\n')[0:5]
    preview_text = '\n'.join(preview)
    print(f"Error ejecutando script (vista previa):\n{preview_text}\n{e}")

def main():
    try:
        # Conexión inicial (sin base de datos seleccionada)
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD
        )
        cursor = conn.cursor()

        print("Creando base de datos y tablas desde file: {}".format(SQL_DATABASE_FILE))
        sql_db = read_sql_file(SQL_DATABASE_FILE)
        if sql_db:
            # Desactivar temporalmente las comprobaciones de FK para permitir crear tablas
            ejecutar_sql_multi(cursor, 'SET FOREIGN_KEY_CHECKS=0;')
            ejecutar_sql_multi(cursor, normalize_sql_for_connector(sql_db))
            ejecutar_sql_multi(cursor, 'SET FOREIGN_KEY_CHECKS=1;')
        else:
            print(f"No se encontró {SQL_DATABASE_FILE}, no se crearán tablas desde archivo.")

        print("Insertando registros iniciales desde file: {}".format(SQL_QUERYS_FILE))
        sql_queries = read_sql_file(SQL_QUERYS_FILE)
        if sql_queries:
            ejecutar_sql_multi(cursor, normalize_sql_for_connector(sql_queries))
        else:
            print(f"No se encontró {SQL_QUERYS_FILE}, omitiendo inserts iniciales.")

        # Asegurar que las tablas de productos existen antes de insertar datos de ejemplo
        print("Creando tablas de productos desde file: {}".format(SQL_PRODUCT_TABLES))
        sql_prod = read_sql_file(SQL_PRODUCT_TABLES)
        if sql_prod:
            ejecutar_sql_multi(cursor, normalize_sql_for_connector(sql_prod))
        else:
            print(f"No se encontró {SQL_PRODUCT_TABLES}, omitiendo creación de tablas de productos.")

        print("Insertando datos de ejemplo desde file: {}".format(SQL_DATOS_EJEMPLO))
        sql_demo = read_sql_file(SQL_DATOS_EJEMPLO)
        if sql_demo:
            ejecutar_sql_multi(cursor, normalize_sql_for_connector(sql_demo))
        else:
            print(f"No se encontró {SQL_DATOS_EJEMPLO}, omitiendo datos de ejemplo.")

        conn.commit()
        print("✅ Base de datos generada con éxito.")

    except Error as e:
        print(f"Error: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
            print("Conexión cerrada.")

if __name__ == "__main__":
    main()