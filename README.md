# Food Store

Trabajo Práctico Integrador de Programación IV. La aplicación reúne una API REST con FastAPI y SQLModel y un frontend administrativo con React, TypeScript y Vite. El modelo contempla usuarios y roles, categorías, productos, relación producto-categoría, pedidos y sus detalles, estados y formas de pago. La API expone autenticación con JWT en cookie HttpOnly y protege las operaciones de escritura con el rol `admin`.

## Requisitos

- Python 3.10 o posterior.
- PostgreSQL 14 o posterior, con una base vacía creada para Food Store.
- Node.js 20 o posterior y pnpm 9 o posterior.

## Configuración del backend

Desde la raíz del proyecto, abrir PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Editar `backend/.env` y establecer `DATABASE_URL` con las credenciales de PostgreSQL y un `SECRET_KEY` aleatorio. El usuario de PostgreSQL indicado debe poder crear tablas en la base. Ejemplo de URL: `postgresql://postgres:contraseña@localhost:5432/food_store`.

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL usada por SQLModel. |
| `CORS_ORIGINS` | Orígenes del frontend separados por coma; desarrollo usa `http://localhost:5173`. |
| `SECRET_KEY` | Secreto para firmar tokens; cambiarlo antes de desplegar. |
| `ALGORITHM` | Algoritmo de firma JWT (`HS256`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración del token de acceso en minutos (30 por defecto). |
| `COOKIE_SECURE` | Usar `false` en HTTP local y `true` detrás de HTTPS. |
| `COOKIE_SAMESITE` | Política SameSite de la cookie (`lax` en desarrollo). |
| `FRONTEND_ORIGIN` | Origen del frontend permitido en CORS. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credenciales del administrador creado por el seed. |
| `ADMIN_NOMBRE`, `ADMIN_APELLIDO` | Nombre y apellido de esa cuenta. |

Inicializar la base con roles, estados, formas de pago, categorías, ingredientes, productos con stock y la cuenta administradora. El comando es idempotente:

```powershell
python -m app.db.seed
```

Credenciales locales del seed de ejemplo: `admin@foodstore.com` / `Admin1234!`. Cambiar la contraseña en `.env` antes de compartir o desplegar el sistema; el seed conserva la contraseña de una cuenta existente.

Iniciar la API desde `backend`:

```powershell
uvicorn app.main:app --reload
```

Documentación interactiva: <http://localhost:8000/docs>. Estado: <http://localhost:8000/health>.

## Configuración del frontend

En otra terminal, desde la raíz:

```powershell
cd frontend
Copy-Item .env.example .env
pnpm install
pnpm build
pnpm dev
```

`frontend/.env.example` contiene `VITE_API_URL`, la URL base de la API. Para desarrollo local apunta a `http://localhost:8000/api/v1`; si se modifica, reiniciar Vite. La interfaz queda disponible en <http://localhost:5173>.

## Funcionalidades

- Registro, inicio y cierre de sesión; autorización por roles.
- Catálogo público de productos; altas, cambios y bajas disponibles para administración.
- Carrito persistido en el navegador, checkout con dirección y forma de pago, consulta/cancelación de pedidos.
- Panel de pedidos con transiciones de estado y resumen de pedidos/ingresos.
- Consulta y administración de categorías, productos, stock, ingredientes y usuarios.
- Gestión de usuarios desde la sección de administración.
- Descuento de stock al crear pedidos y restitución al cancelar.
- Endpoints documentados automáticamente en Swagger/OpenAPI.
