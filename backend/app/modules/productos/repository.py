from sqlalchemy import func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.productos.model import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session):
        super().__init__(session, Producto)

    def search(self, *, skip: int, limit: int, search: str | None,
               categoria_id: int | None, disponible: bool | None) -> tuple[int, list[Producto]]:
        statement = select(Producto).where(Producto.activo.is_(True))
        count_statement = select(func.count(Producto.id)).where(Producto.activo.is_(True))
        if disponible is not None:
            statement = statement.where(Producto.disponible.is_(disponible))
            count_statement = count_statement.where(Producto.disponible.is_(disponible))
        if search:
            condition = Producto.nombre.ilike(f"%{search.strip()}%")
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        if categoria_id is not None:
            statement = statement.where(Producto.categoria_id == categoria_id)
            count_statement = count_statement.where(Producto.categoria_id == categoria_id)
        total = self.session.exec(count_statement).one()
        rows = self.session.exec(statement.order_by(Producto.id).offset(skip).limit(limit)).all()
        return total, list(rows)
