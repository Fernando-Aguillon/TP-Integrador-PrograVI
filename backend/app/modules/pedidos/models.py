from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Column, DateTime, Numeric
from sqlmodel import Field, Relationship, SQLModel

from app.modules.usuarios.models import Usuario
from app.modules.productos.model import Producto


class Pedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True), nullable=False)
    estado: str = Field(default="PENDIENTE", max_length=20, nullable=False)
    forma_pago: str = Field(default="EFECTIVO", max_length=20, nullable=False)
    direccion_entrega: str = Field(default="", max_length=200, nullable=False)
    notas: str | None = Field(default=None, max_length=1000)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    total: Decimal = Field(default=Decimal("0.00"), sa_column=Column(Numeric(10, 2), nullable=False, default=0))
    usuario: Usuario = Relationship(back_populates="pedidos")
    items: list["DetallePedido"] = Relationship(back_populates="pedido")


class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalle_pedido"

    id: int | None = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", index=True, ondelete="CASCADE", nullable=False)
    producto_id: int = Field(foreign_key="producto.id", ondelete="RESTRICT", nullable=False)
    cantidad: int = Field(ge=1, nullable=False)
    nombre_producto: str = Field(default="", max_length=150, nullable=False)
    precio_unitario: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    subtotal: Decimal = Field(default=Decimal("0.00"), sa_column=Column(Numeric(10, 2), nullable=False, default=0))
    pedido: Pedido = Relationship(back_populates="items")
    producto: Producto = Relationship(back_populates="detalles")
