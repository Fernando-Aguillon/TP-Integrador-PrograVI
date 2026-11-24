from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.categorias.router import router as categoria_router
from app.core.config import settings
from app.core.database import create_db_and_tables
from app.modules.auth.router import router as auth_router
from app.modules.usuarios.router import router as usuarios_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as producto_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Food Store API",
    description="API de Food Store con autenticación y gestión de usuarios, categorías, productos y pedidos.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in (settings.cors_origins or settings.frontend_origin).split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(usuarios_router, prefix="/api/v1")
app.include_router(categoria_router, prefix="/api/v1")
app.include_router(producto_router, prefix="/api/v1")
app.include_router(pedidos_router, prefix="/api/v1")


@app.get("/health", tags=["Estado"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
