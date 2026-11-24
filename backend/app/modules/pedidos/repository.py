from datetime import datetime

from sqlalchemy.orm import selectinload
from sqlalchemy import func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.productos.model import Producto


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session):
        super().__init__(session, Pedido)

    def list_page(self, *, usuario_id: int | None, estado: str | None, skip: int, limit: int) -> tuple[int, list[Pedido]]:
        statement = select(Pedido)
        count_statement = select(func.count(Pedido.id))
        if usuario_id is not None:
            statement = statement.where(Pedido.usuario_id == usuario_id)
            count_statement = count_statement.where(Pedido.usuario_id == usuario_id)
        if estado:
            statement = statement.where(Pedido.estado == estado)
            count_statement = count_statement.where(Pedido.estado == estado)
        total = self.session.exec(count_statement).one()
        statement = statement.options(selectinload(Pedido.items), selectinload(Pedido.usuario))
        statement = statement.order_by(Pedido.created_at.desc(), Pedido.id.desc()).offset(skip).limit(limit)
        return total, list(self.session.exec(statement).all())

    def get_for_update(self, pedido_id: int) -> Pedido | None:
        statement = select(Pedido).where(Pedido.id == pedido_id).options(selectinload(Pedido.items), selectinload(Pedido.usuario)).with_for_update()
        return self.session.exec(statement).first()


class DetallePedidoRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        self.session.flush()
        return detalle

    def list_for_pedido(self, pedido_id: int) -> list[DetallePedido]:
        statement = select(DetallePedido).where(DetallePedido.pedido_id == pedido_id).order_by(DetallePedido.id)
        return list(self.session.exec(statement).all())


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session):
        super().__init__(session, Producto)

    def get_for_update(self, producto_id: int) -> Producto | None:
        statement = select(Producto).where(Producto.id == producto_id).with_for_update()
        return self.session.exec(statement).first()

    def get_many_for_update(self, product_ids: list[int]) -> dict[int, Producto]:
        statement = select(Producto).where(Producto.id.in_(product_ids)).order_by(Producto.id).with_for_update()
        return {product.id: product for product in self.session.exec(statement).all()}
