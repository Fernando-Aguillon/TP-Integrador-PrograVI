
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import selectinload
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
        items=[
            DetallePedidoRead.model_validate(item)
            for item in pedido.items
        ],
    )


class PedidoService:
    def __init__(self, uow_factory=PedidoUnitOfWork):
        self.uow_factory = uow_factory

    def listar(
        self,
        *,
        usuario_id: int | None,
        estado: str | None,
        skip: int,
        limit: int,
    ) -> PedidosPage:
        with self.uow_factory() as uow:
            total, orders = uow.pedidos.list_page(
                usuario_id=usuario_id,
                estado=estado,
                skip=skip,
                limit=limit,
            )

            return PedidosPage(
                total=total,
                items=[_read(order) for order in orders],
            )

    def obtener(self, pedido_id: int) -> PedidoRead:
        with self.uow_factory() as uow:
            pedido = uow.pedidos.get_for_update(pedido_id)

            if pedido is None:
                raise PedidoNoEncontrado()

            return _read(pedido)

    def crear(
        self,
        data: PedidoCreate,
        usuario_id: int,
    ) -> PedidoRead:
        with self.uow_factory() as uow:
            product_ids = [
                item.producto_id
                for item in data.items
            ]

            if len(product_ids) != len(set(product_ids)):
                raise ReglaPedidoError(
                    "Un producto no puede repetirse en el pedido"
                )

            products = uow.productos.get_many_for_update(
                sorted(product_ids)
            )

            user = uow.session.get(Usuario, usuario_id)

            if user is None or user.disabled:
                raise PermissionError("La cuenta no está activa")

            order = Pedido(
                usuario_id=usuario_id,
                estado="PENDIENTE",
                forma_pago=data.forma_pago,
                direccion_entrega=data.direccion_entrega.strip(),
                notas=data.notas.strip() if data.notas else None,
                total=Decimal("0.00"),
            )

            order.usuario = user
            uow.pedidos.add(order)

            total = Decimal("0.00")

            for entry in sorted(
                data.items,
                key=lambda item: item.producto_id,
            ):
                product = products.get(entry.producto_id)

                if product is None or not product.activo:
                    raise ProductoNoEncontrado(entry.producto_id)

                if not product.disponible:
                    raise ReglaPedidoError(
                        f"{product.nombre} no está disponible"
                    )

                if product.stock < entry.cantidad:
                    raise ReglaPedidoError(
                        f"Stock insuficiente para {product.nombre}"
                    )

                price = Decimal(
                    str(product.precio_base)
                ).quantize(Decimal("0.01"))

                subtotal = price * entry.cantidad

                # Descontar stock dentro de la misma transacción.
                product.stock -= entry.cantidad
                uow.session.add(product)

                # Guardar una copia del nombre y precio del producto.
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
            order.updated_at = datetime.now(timezone.utc)

            uow.session.add(order)
            uow.session.flush()

            return _read(order)

    def cambiar_estado(
        self,
        pedido_id: int,
        data: PedidoEstadoUpdate,
    ) -> PedidoRead:
        with self.uow_factory() as uow:
            pedido = uow.pedidos.get_for_update(pedido_id)

            if pedido is None:
                raise PedidoNoEncontrado()

            transiciones_permitidas = TRANSITIONS.get(
                pedido.estado,
                set(),
            )

            if data.estado not in transiciones_permitidas:
                raise ReglaPedidoError(
                    "Transición de estado no permitida"
                )

            if data.estado == "CANCELADO":
                self._restore_stock(uow, pedido)

            pedido.estado = data.estado
            pedido.updated_at = datetime.now(timezone.utc)

            uow.session.add(pedido)

            return _read(pedido)

    def cancelar_cliente(
        self,
        pedido_id: int,
        usuario_id: int,
    ) -> PedidoRead:
        with self.uow_factory() as uow:
            pedido = uow.pedidos.get_for_update(pedido_id)

            if pedido is None:
                raise PedidoNoEncontrado()

            if pedido.usuario_id != usuario_id:
                raise PermissionError(
                    "El pedido pertenece a otro usuario"
                )

            if pedido.estado != "PENDIENTE":
                raise ReglaPedidoError(
                    "Solo se pueden cancelar pedidos pendientes"
                )

            self._restore_stock(uow, pedido)

            pedido.estado = "CANCELADO"
            pedido.updated_at = datetime.now(timezone.utc)

            uow.session.add(pedido)

            return _read(pedido)

    @staticmethod
    def _restore_stock(uow, pedido: Pedido) -> None:
        product_ids = sorted({
            detail.producto_id
            for detail in pedido.items
        })

        products = uow.productos.get_many_for_update(product_ids)

        for detail in pedido.items:
            product = products.get(detail.producto_id)

            if product is not None:
                product.stock += detail.cantidad
                uow.session.add(product)

    def resumen(self) -> PedidosResumen:
        with self.uow_factory() as uow:
            # Contar pedidos agrupados por estado directamente en la BD.
            state_rows = uow.session.exec(
                select(
                    Pedido.estado,
                    func.count(Pedido.id),
                ).group_by(Pedido.estado)
            ).all()

            counts = dict(state_rows)

            # Calcular el rango del día actual en UTC.
            now = datetime.now(timezone.utc)

            start_of_day = now.replace(
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )

            end_of_day = start_of_day + timedelta(days=1)

            pedidos_hoy = uow.session.exec(
                select(func.count(Pedido.id)).where(
                    Pedido.created_at >= start_of_day,
                    Pedido.created_at < end_of_day,
                )
            ).one()

            # Sumar ingresos únicamente de pedidos entregados.
            ingresos = uow.session.exec(
                select(
                    func.coalesce(
                        func.sum(Pedido.total),
                        Decimal("0.00"),
                    )
                ).where(
                    Pedido.estado == "ENTREGADO"
                )
            ).one()

            return PedidosResumen(
                pendientes=counts.get("PENDIENTE", 0),
                en_preparacion=counts.get("EN_PREPARACION", 0),
                entregados=counts.get("ENTREGADO", 0),
                cancelados=counts.get("CANCELADO", 0),
                pedidos_hoy=pedidos_hoy,
                ingresos_entregados=float(ingresos),
            )


service = PedidoService()
