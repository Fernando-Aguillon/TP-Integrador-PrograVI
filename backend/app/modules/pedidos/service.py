from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlmodel import select

from app.modules.usuarios.models import Usuario
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    DetallePedidoRead,
    PedidoCreate,
    PedidoEstadoUpdate,
    PedidoRead,
    PedidosPage,
    PedidosResumen,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork

TRANSITIONS = {
    "PENDIENTE": {"EN_PREPARACION", "CANCELADO"},
    "EN_PREPARACION": {"ENTREGADO", "CANCELADO"},
    "ENTREGADO": set(),
    "CANCELADO": set(),
}


class PedidoNoEncontrado(Exception):
    pass


class ProductoNoEncontrado(Exception):
    def __init__(self, producto_id: int):
        self.producto_id = producto_id
        super().__init__(f"Producto {producto_id} no encontrado")


class ReglaPedidoError(Exception):
    pass


def _read(pedido: Pedido) -> PedidoRead:
    return PedidoRead(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        usuario_username=pedido.usuario.username,
        created_at=pedido.created_at,
        updated_at=pedido.updated_at,
        estado=pedido.estado,
        forma_pago=pedido.forma_pago,
        direccion_entrega=pedido.direccion_entrega,
        notas=pedido.notas,
        total=float(pedido.total),
        items=[DetallePedidoRead.model_validate(item) for item in pedido.items],
    )


class PedidoService:
    def __init__(self, uow_factory=PedidoUnitOfWork):
        self.uow_factory = uow_factory

    def listar(self, *, usuario_id: int | None, estado: str | None, skip: int, limit: int) -> PedidosPage:
        with self.uow_factory() as uow:
            total, orders = uow.pedidos.list_page(usuario_id=usuario_id, estado=estado, skip=skip, limit=limit)
            return PedidosPage(total=total, items=[_read(order) for order in orders])

    def obtener(self, pedido_id: int) -> PedidoRead:
        with self.uow_factory() as uow:
            pedido = uow.pedidos.get_for_update(pedido_id)
            if pedido is None:
                raise PedidoNoEncontrado()
            return _read(pedido)

    def crear(self, data: PedidoCreate, usuario_id: int) -> PedidoRead:
        with self.uow_factory() as uow:
            product_ids = [item.producto_id for item in data.items]
            if len(product_ids) != len(set(product_ids)):
                raise ReglaPedidoError("Un producto no puede repetirse en el pedido")
            products = uow.productos.get_many_for_update(sorted(item.producto_id for item in data.items))
            order = Pedido(
                usuario_id=usuario_id,
                estado="PENDIENTE",
                forma_pago=data.forma_pago,
                direccion_entrega=data.direccion_entrega.strip(),
                notas=data.notas.strip() if data.notas else None,
                total=Decimal("0.00"),
            )
            user = uow.session.get(Usuario, usuario_id)
            if user is None or user.disabled:
                raise PermissionError("La cuenta no está activa")
            order.usuario = user
            uow.pedidos.add(order)
            total = Decimal("0.00")
            for entry in sorted(data.items, key=lambda item: item.producto_id):
                product = products.get(entry.producto_id)
                if product is None or not product.activo:
                    raise ProductoNoEncontrado(entry.producto_id)
                if not product.disponible:
                    raise ReglaPedidoError(f"{product.nombre} no está disponible")
                if product.stock < entry.cantidad:
                    raise ReglaPedidoError(f"Stock insuficiente para {product.nombre}")
                price = Decimal(str(product.precio_base)).quantize(Decimal("0.01"))
                subtotal = price * entry.cantidad
                product.stock -= entry.cantidad
                detail = DetallePedido(
                    producto_id=product.id,
                    cantidad=entry.cantidad,
                    nombre_producto=product.nombre,
                    precio_unitario=price,
                    subtotal=subtotal,
                )
                order.items.append(detail)
                total += subtotal
            order.total = total
            order.updated_at = datetime.now().astimezone()
            uow.session.add(order)
            uow.session.flush()
            return _read(order)

    def cambiar_estado(self, pedido_id: int, data: PedidoEstadoUpdate) -> PedidoRead:
        with self.uow_factory() as uow:
            pedido = uow.pedidos.get_for_update(pedido_id)
            if pedido is None:
                raise PedidoNoEncontrado()
            if data.estado not in TRANSITIONS[pedido.estado]:
                raise ReglaPedidoError("Transición de estado no permitida")
            if data.estado == "CANCELADO":
                self._restore_stock(uow, pedido)
            pedido.estado = data.estado
            pedido.updated_at = datetime.now().astimezone()
            uow.session.add(pedido)
            return _read(pedido)

    def cancelar_cliente(self, pedido_id: int, usuario_id: int) -> PedidoRead:
        with self.uow_factory() as uow:
            pedido = uow.pedidos.get_for_update(pedido_id)
            if pedido is None:
                raise PedidoNoEncontrado()
            if pedido.usuario_id != usuario_id:
                raise PermissionError("El pedido pertenece a otro usuario")
            if pedido.estado != "PENDIENTE":
                raise ReglaPedidoError("Solo se pueden cancelar pedidos pendientes")
            self._restore_stock(uow, pedido)
            pedido.estado = "CANCELADO"
            pedido.updated_at = datetime.now().astimezone()
            uow.session.add(pedido)
            return _read(pedido)

    @staticmethod
    def _restore_stock(uow, pedido: Pedido) -> None:
        products = uow.productos.get_many_for_update(sorted({detail.producto_id for detail in pedido.items}))
        for detail in pedido.items:
            product = products.get(detail.producto_id)
            if product is not None:
                product.stock += detail.cantidad
                uow.session.add(product)

    def resumen(self) -> PedidosResumen:
        with self.uow_factory() as uow:
            rows = uow.session.exec(select(Pedido)).all()
            today = datetime.now().astimezone().date()
            return PedidosResumen(
                pendientes=sum(order.estado == "PENDIENTE" for order in rows),
                en_preparacion=sum(order.estado == "EN_PREPARACION" for order in rows),
                entregados=sum(order.estado == "ENTREGADO" for order in rows),
                cancelados=sum(order.estado == "CANCELADO" for order in rows),
                pedidos_hoy=sum(order.created_at.astimezone().date() == today for order in rows),
                ingresos_entregados=float(sum((order.total for order in rows if order.estado == "ENTREGADO"), Decimal("0.00"))),
            )


service = PedidoService()
