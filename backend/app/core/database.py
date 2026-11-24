from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def create_db_and_tables() -> None:
    from app.modules.categorias.model import Categoria  # noqa: F401
    from app.modules.productos.model import Producto  # noqa: F401
    from app.modules.pedidos.models import DetallePedido, Pedido  # noqa: F401
    from app.modules.usuarios.models import Usuario  # noqa: F401

    SQLModel.metadata.create_all(engine)
