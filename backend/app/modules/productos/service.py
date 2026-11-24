from fastapi import HTTPException
from sqlmodel import Session, select

from app.modules.categorias.model import Categoria
from app.modules.productos.model import Producto
from app.modules.productos.repository import ProductoRepository
from app.modules.productos.schema import ProductoCreate, ProductoPage, ProductoRead, ProductoUpdate
from app.modules.categorias.schema import CategoriaRead
from app.modules.productos.unit_of_work import ProductoUnitOfWork


def _read(product: Producto) -> ProductoRead:
    return ProductoRead(
        id=product.id, categoria_id=product.categoria_id, categoria=CategoriaRead.model_validate(product.categoria),
        nombre=product.nombre, descripcion=product.descripcion, precio_base=product.precio_base,
        imagen_url=product.imagen_url, stock=product.stock, disponible=product.disponible, activo=product.activo,
    )


def listar(session: Session, *, skip: int = 0, limit: int = 20, search: str | None = None,
           categoria_id: int | None = None, disponible: bool | None = None) -> ProductoPage:
    total, products = ProductoRepository(session).search(skip=skip, limit=limit, search=search,
                                                          categoria_id=categoria_id, disponible=disponible)
    return ProductoPage(total=total, items=[_read(product) for product in products])


def obtener(session: Session, producto_id: int) -> ProductoRead:
    product = session.get(Producto, producto_id)
    if product is None or not product.activo:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return _read(product)


def _validate_category(session: Session, categoria_id: int) -> None:
    category = session.get(Categoria, categoria_id)
    if category is None or not category.activo:
        raise HTTPException(status_code=404, detail="Categoría no encontrada o inactiva")


def crear(datos: ProductoCreate) -> ProductoRead:
    with ProductoUnitOfWork() as uow:
        _validate_category(uow.session, datos.categoria_id)
        product = Producto(**datos.model_dump(), activo=True)
        uow.productos.add(product)
        result = _read(product)
    return result


def actualizar(producto_id: int, datos: ProductoUpdate) -> ProductoRead:
    with ProductoUnitOfWork() as uow:
        product = uow.productos.get_by_id(producto_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        changes = datos.model_dump(exclude_unset=True)
        if "categoria_id" in changes and changes["categoria_id"] is not None:
            _validate_category(uow.session, changes["categoria_id"])
        for key, value in changes.items():
            if value is not None:
                setattr(product, key, value)
        uow.session.add(product)
        uow.session.flush()
        result = _read(product)
    return result


def actualizar_stock(producto_id: int, stock: int, disponible: bool) -> ProductoRead:
    with ProductoUnitOfWork() as uow:
        product = uow.productos.get_by_id(producto_id)
        if product is None or not product.activo:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        product.stock = stock
        product.disponible = disponible
        uow.session.add(product)
        uow.session.flush()
        result = _read(product)
    return result


def eliminar(producto_id: int) -> None:
    with ProductoUnitOfWork() as uow:
        product = uow.productos.get_by_id(producto_id)
        if product is None or not product.activo:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        product.activo = False
        uow.session.add(product)
