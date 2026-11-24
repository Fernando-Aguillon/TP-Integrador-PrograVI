from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

EstadoPedido = Literal["PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO"]
FormaPago = Literal["EFECTIVO", "TRANSFERENCIA"]
DireccionEntrega = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=5, max_length=200),
]


class ItemPedidoCreate(BaseModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(ge=1, le=100)


class PedidoCreate(BaseModel):
    items: list[ItemPedidoCreate] = Field(min_length=1, max_length=50)
    forma_pago: FormaPago
    direccion_entrega: DireccionEntrega
    notas: str | None = Field(default=None, max_length=1000)

class PedidoEstadoUpdate(BaseModel):
    estado: EstadoPedido


class DetallePedidoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    producto_id: int
    cantidad: int
    nombre_producto: str
    precio_unitario: float
    subtotal: float


class PedidoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    usuario_id: int
    usuario_username: str
    created_at: datetime
    updated_at: datetime
    estado: EstadoPedido
    forma_pago: FormaPago
    direccion_entrega: str
    notas: str | None = None
    total: float
    items: list[DetallePedidoRead] = Field(default_factory=list)


class PedidosPage(BaseModel):
    total: int
    items: list[PedidoRead]


class PedidosResumen(BaseModel):
    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float
