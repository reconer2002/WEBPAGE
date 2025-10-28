# Mentes Creativas Store - Instalación Local

Sistema de personalización de prendas con herramienta de diseño interactiva y carrito de compras.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes programas:

### Software Requerido:
- **Visual Studio Code** (o cualquier editor de código)
- **MySQL Server** (versión 8.0 o superior)
- **MySQL Workbench** (para gestión de base de datos)
- **Node.js** (versión 18.0 o superior)
- **npm** (incluido con Node.js)

### Verificar Instalaciones:
```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar que MySQL esté corriendo
mysql --version
```

## 🚀 Instalación Paso a Paso

### 1. Configurar Base de Datos

#### 1.1. Crear Base de Datos
1. Abrir **MySQL Workbench**
2. Conectarse al servidor MySQL local
3. Ir a `File > Open SQL Script`
4. Navegar a la carpeta `backend/sql/` del proyecto
5. Importar los siguientes archivos en orden:
   - `database.sql` (estructura básica)
   - `complete.sql` (datos completos)

#### 1.2. Verificar Configuración
- Base de datos creada: `mentescreativasstore`
- Usuario por defecto: `root`
- Contraseña por defecto: `1234`

> **⚠️ Importante:** Si tu configuración de MySQL es diferente, edita el archivo `backend/.env`

### 2. Configurar Variables de Entorno

El archivo `backend/.env` ya está configurado con valores por defecto:
```env
PORT=3000
DB_NAME_PROD=mentescreativasstore
DB_HOST=localhost
DB_USER=root
DB_PASS=1234
```

**Modifica estos valores según tu configuración local de MySQL.**

### 4. Instalar Dependencias

#### 4.1. Abrir el Proyecto
1. Abrir **Visual Studio Code**
2. Abrir la carpeta del proyecto: `File > Open Folder > WEBPAGE`

#### 4.2. Configurar Terminales
1. Abrir **2 terminales** en VS Code:
   - `Terminal > New Terminal` (primera terminal)
   - Click en el `+` para crear segunda terminal

#### 4.3. Configurar PowerShell (Solo Windows)
En **ambas terminales**, ejecutar:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

#### 4.4. Instalar Backend
En la **primera terminal**:
```bash
cd backend
npm install
```

#### 4.5. Instalar Frontend
En la **segunda terminal**:
```bash
cd frontend
npm install
```

### 5. Ejecutar el Proyecto

#### 5.1. Iniciar Backend
En la terminal del **backend**:
```bash
npm run dev
```
Debería mostrar: `Servidor corriendo en puerto 3000`

#### 5.2. Iniciar Frontend
En la terminal del **frontend**:
```bash
npm run dev
```
Debería mostrar algo como: `Local: http://localhost:5173/`

### 6. Acceder a la Aplicación

1. Abrir el navegador
2. Ir a la URL mostrada en la terminal del frontend (normalmente `http://localhost:5173`)
3. La aplicación debería cargar correctamente

## 🔧 Configuración Adicional

### Puertos por Defecto:
- **Frontend:** `http://localhost:5173` (Vite)
- **Backend:** `http://localhost:3000` (Express)
- **MySQL:** `localhost:3306`

### Estructura del Proyecto:
```
WEBPAGE/
├── backend/
│   ├── index.js          # Servidor Express
│   ├── db.js            # Configuración MySQL
│   ├── package.json     # Dependencias backend
│   ├── .env            # Variables de entorno
│   ├── sql/            # Scripts de base de datos
│   ├── routes/         # Rutas API
│   └── middleware/     # Middlewares
└── frontend/
    ├── src/            # Código fuente React
    ├── package.json    # Dependencias frontend
    └── public/         # Archivos estáticos
```

## 🛠️ Solución de Problemas

### Error de Conexión a MySQL:
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solución:** Verificar que MySQL Server esté ejecutándose

### Error de PowerShell:
```bash
cannot be loaded because running scripts is disabled
```
**Solución:** Ejecutar `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

### Error de Puerto Ocupado:
```bash
Port 3000 is already in use
```
**Solución:** 
1. Cambiar puerto en `backend/.env`: `PORT=3001`
2. O cerrar otros procesos que usen el puerto

### Problemas de Base de Datos:
1. Verificar que MySQL esté corriendo
2. Comprobar credenciales en `backend/.env`
3. Verificar que la base de datos `mentescreativasstore` exista

## 📚 Funcionalidades Principales

- **Herramienta de Diseño:** Personalización de prendas con texto e imágenes
- **Carrito de Compras:** Sistema completo de compras con simulación
- **Gestión de Usuario:** Login, registro y permisos
- **Mantenedor:** Panel de administración
- **Responsive Design:** Compatible con móviles y tablets

## 🚦 Estados del Servidor

### Backend Funcionando Correctamente:
```
Servidor corriendo en puerto 3000
Conectado a la base de datos: mentescreativasstore
```

### Frontend Funcionando Correctamente:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 📞 Soporte

Si tienes problemas durante la instalación:

1. Verifica que todos los requisitos previos estén instalados
2. Revisa que los puertos no estén ocupados
3. Confirma que MySQL esté corriendo y configurado correctamente
4. Verifica que las variables de entorno coincidan con tu configuración

---

**¡Listo!** Tu entorno de desarrollo local debería estar funcionando correctamente.