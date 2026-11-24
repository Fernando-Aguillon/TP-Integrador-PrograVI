
# Food Store

Trabajo Práctico Integrador de Programación IV.

Food Store es una aplicación de gestión de pedidos y productos que utiliza FastAPI, SQLModel y PostgreSQL en el backend, y React, TypeScript y Vite en el frontend.

## Requisitos

- Python 3.11, 3.12 o 3.13.
- PostgreSQL 14 o superior.
- Node.js 20.19 o superior.
- pnpm 9 o superior.

## 1. Clonar el repositorio

```bash
git clone https://github.com/Fernando-Aguillon/TP-Integrador-PrograVI.git
cd TP-Integrador-PrograVI
```

## 2. Configurar el backend

Desde la raíz del proyecto, abrir una terminal PowerShell:

```powershell
cd backend

python -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install -r requirements.txt

Copy-Item .env.example .env
```

Editar `backend/.env` y configurar las variables necesarias.

### Variables de entorno

| Variable | Descripción |
|---|---|
| DATABASE_URL | Cadena de conexión a PostgreSQL. |
| CORS_ORIGINS | Orígenes permitidos para solicitudes CORS. |
| FRONTEND_ORIGIN | Origen del frontend. |
| SECRET_KEY | Clave secreta utilizada para firmar JWT. |
| ALGORITHM | Algoritmo de firma del token. |
| ACCESS_TOKEN_EXPIRE_MINUTES | Duración del token en minutos. |
| COOKIE_SECURE | Activar en producción cuando se utiliza HTTPS. |
| COOKIE_SAMESITE | Política SameSite de la cookie. |
| ADMIN_USERNAME | Usuario del administrador inicial. |
| ADMIN_EMAIL | Correo del administrador inicial. |
| ADMIN_PASSWORD | Contraseña del administrador inicial. |
| ADMIN_FULL_NAME | Nombre completo del administrador. |

Ejemplo de conexión PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:TU_CONTRASENA@localhost:5432/food_store
```

La base de datos `food_store` debe existir previamente.

### Inicializar la base de datos

Con el entorno virtual activo y ubicado dentro de `backend`:

```powershell
python -m app.db.seed
```

Este comando crea las tablas necesarias y carga los datos iniciales:

- Cuenta administradora.
- Categorías de productos.
- Productos de ejemplo con stock inicial.

El proceso es idempotente: puede ejecutarse nuevamente sin duplicar los registros iniciales existentes.

Credenciales predeterminadas del administrador:

| Campo | Valor |
|---|---|
| Usuario | admin |
| Contraseña | Admin1234! |
| Correo | admin@foodstore.com |

Cambiar las credenciales en `.env` antes de utilizar el sistema fuera del entorno local.

### Ejecutar el backend

Desde la carpeta `backend`:

```powershell
uvicorn app.main:app --reload
```

La API estará disponible en:

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## 3. Configurar el frontend

Abrir otra terminal PowerShell desde la raíz del proyecto:

```powershell
cd frontend

Copy-Item .env.example .env

pnpm install
```

La variable `VITE_API_URL` configura la URL base de la API.

Valor predeterminado:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Ejecutar el frontend

```powershell
pnpm dev
```

La aplicación estará disponible en:

http://localhost:5173

### Generar el build de producción

```powershell
pnpm build
```

## 4. Funcionalidades principales

### Usuarios y autenticación

- Registro e inicio de sesión.
- Autenticación mediante JWT almacenado en cookie HttpOnly.
- Cierre de sesión.
- Autorización según roles de usuario.
- Gestión administrativa de usuarios.

### Catálogo

- Consulta de productos.
- Búsqueda y paginación.
- Administración de categorías.
- Alta, modificación y baja de productos.
- Gestión de disponibilidad y stock.

### Pedidos

- Carrito de compras.
- Confirmación de pedidos.
- Consulta de pedidos propios.
- Cancelación de pedidos.
- Actualización de estados desde administración.
- Control y actualización de stock.
- Resumen de pedidos e ingresos.

## 5. Tecnologías utilizadas

### Backend

- Python
- FastAPI
- SQLModel
- PostgreSQL
- Pydantic
- JWT

### Frontend

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 4
- TanStack Query
- TanStack Form
- TanStack Table
- Zustand
- Axios
- React Router

## 6. Estructura del proyecto

```text
TP-Integrador-PrograVI/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── db/
│   │   └── modules/
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## 7. Repositorio

https://github.com/Fernando-Aguillon/TP-Integrador-PrograVI
