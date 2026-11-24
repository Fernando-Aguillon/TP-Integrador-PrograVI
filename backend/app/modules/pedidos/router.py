
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.core.deps import get_current_active_user, require_role
from app.modules.usuarios.models import Usuario
from app.modules.pedidos import schemas
from app.modules.pedidos.service import (
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoEncontrado,
    ReglaPedidoError,
    service,
)

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

ActiveUserDep = Annotated[Usuario, Depends(get_current_active_user)]
AdminDep = Annotated[Usuario, Depends(require_role(["admin"]))]


def get_pedido_service() -> PedidoService:
    return service


PedidoServiceDep = Annotated[PedidoService, Depends(get_pedido_service)]


def _translate(error: Exception) -> HTTPException:
    if isinstance(error, (PedidoNoEncontrado, ProductoNoEncontrado)):
        return HTTPException(
            status_code=404,
            detail=str(error) or "Pedido o producto no encontrado",
        )

    if isinstance(error, PermissionError):
        return HTTPException(
            status_code=403,
            detail=str(error),
        )

    return HTTPException(
        status_code=400,
        detail=str(error),
    )


@router.get("/resumen", response_model=schemas.PedidosResumen)
def resumen(
    _admin: AdminDep,
    pedido_service: PedidoServiceDep,
):
    return pedido_service.resumen()


@router.get("/", response_model=schemas.PedidosPage)
def listar_pedidos(
    usuario: ActiveUserDep,
    pedido_service: PedidoServiceDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    estado: schemas.EstadoPedido | None = None,
):
    return pedido_service.listar(
        usuario_id=None if usuario.role == "admin" else usuario.id,
        estado=estado,
        skip=skip,
        limit=limit,
    )


@router.get("/{pedido_id}", response_model=schemas.PedidoRead)
def obtener_pedido(
    pedido_id: Annotated[int, Path(gt=0)],
    usuario: ActiveUserDep,
    pedido_service: PedidoServiceDep,
):
    try:
        pedido = pedido_service.obtener(pedido_id)

        if pedido.usuario_id != usuario.id and usuario.role != "admin":
            raise PermissionError("El pedido pertenece a otro usuario")

        return pedido

    except (PedidoNoEncontrado, PermissionError) as error:
        raise _translate(error) from error


@router.post(
    "/",
    response_model=schemas.PedidoRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_pedido(
    data: schemas.PedidoCreate,
    usuario: ActiveUserDep,
    pedido_service: PedidoServiceDep,
):
    try:
        return pedido_service.crear(data, usuario.id)

    except (
        PedidoNoEncontrado,
        ProductoNoEncontrado,
        ReglaPedidoError,
        PermissionError,
    ) as error:
        raise _translate(error) from error


@router.patch(
    "/{pedido_id}/estado",
    response_model=schemas.PedidoRead,
)
def cambiar_estado(
    data: schemas.PedidoEstadoUpdate,
    pedido_id: Annotated[int, Path(gt=0)],
    _admin: AdminDep,
    pedido_service: PedidoServiceDep,
):
    try:
        return pedido_service.cambiar_estado(pedido_id, data)

    except (PedidoNoEncontrado, ReglaPedidoError) as error:
        raise _translate(error) from error


@router.patch(
    "/{pedido_id}/cancelar",
    response_model=schemas.PedidoRead,
)
def cancelar_pedido(
    pedido_id: Annotated[int, Path(gt=0)],
    usuario: ActiveUserDep,
    pedido_service: PedidoServiceDep,
):
    if usuario.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Los pedidos del panel se administran desde su estado",
        )

    try:
        return pedido_service.cancelar_cliente(pedido_id, usuario.id)

    except (
        PedidoNoEncontrado,
        PermissionError,
        ReglaPedidoError,
    ) as error:
        raise _translate(error) from error
