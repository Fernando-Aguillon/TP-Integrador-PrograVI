from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import require_role
from app.modules.usuarios.models import Usuario
from app.modules.productos import schema, service

router = APIRouter(prefix="/productos", tags=["Productos"])
SessionDep = Annotated[Session, Depends(get_session)]
AdminDep = Annotated[Usuario, Depends(require_role(["admin"]))]


@router.get("/", response_model=schema.ProductoPage)
def listar_productos(
    session: SessionDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=150),
    categoria_id: int | None = Query(None, gt=0),
    disponible: bool | None = None,
):
    return service.listar(session, skip=skip, limit=limit, search=search, categoria_id=categoria_id, disponible=disponible)


@router.get("/{producto_id}", response_model=schema.ProductoRead)
def obtener_producto(producto_id: Annotated[int, Path(gt=0)], session: SessionDep):
    return service.obtener(session, producto_id)


@router.post("/", response_model=schema.ProductoRead, status_code=status.HTTP_201_CREATED)
def crear_producto(datos: schema.ProductoCreate, _admin: AdminDep, session: SessionDep):
    return service.crear(datos)


@router.put("/{producto_id}", response_model=schema.ProductoRead)
def actualizar_producto(datos: schema.ProductoUpdate, producto_id: Annotated[int, Path(gt=0)], _admin: AdminDep, session: SessionDep):
    return service.actualizar(producto_id, datos)


@router.patch("/{producto_id}/stock", response_model=schema.ProductoRead)
def actualizar_stock(datos: schema.StockUpdate, producto_id: Annotated[int, Path(gt=0)], _admin: AdminDep, session: SessionDep):
    return service.actualizar_stock(producto_id, datos.stock, datos.disponible)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(producto_id: Annotated[int, Path(gt=0)], _admin: AdminDep, session: SessionDep):
    service.eliminar(producto_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
