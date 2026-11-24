
from fastapi import HTTPException

from app.modules.categorias.model import Categoria
from app.modules.categorias.schema import CategoriaRead
from app.modules.productos.model import Producto
from app.modules.productos.repository import ProductoRepository
from app.modules.productos.schema import (
    ProductoCreate,
    ProductoPage,
    ProductoRead,
    ProductoUpdate
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


def _read(product: Producto) -> ProductoRead:
    return ProductoRead(
        id=product.id,
        categoria_id=product.categoria_id,
        categoria=CategoriaRead.model_validate(product.categoria),
        nombre=product.nombre,
        descripcion=product.descripcion,
        precio_base=product.precio_base,
        imagen_url=product.imagen_url,
        stock=product.stock,
        disponible=product.disponible,
        activo=product.activo
    )


def _validate_category(
    categoria: Categoria | None
) -> None:
    if categoria is None or not categoria.activo:
        raise HTTPException(
            status_code=404,
            detail="Categoría no encontrada o inactiva"
        )


def listar(
    *,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    categoria_id: int | None = None,
    disponible: bool | None = None
) -> ProductoPage:

    with ProductoUnitOfWork() as uow:
        total, products = uow.productos.search(
            skip=skip,
            limit=limit,
            search=search,
            categoria_id=categoria_id,
            disponible=disponible
        )

        return ProductoPage(
            total=total,
            items=[
                _read(product)
                for product in products
            ]
        )


def obtener(producto_id: int) -> ProductoRead:
    with ProductoUnitOfWork() as uow:
        product = uow.productos.get_by_id(producto_id)

        if product is None or not product.activo:
            raise HTTPException(
                status_code=404,
                detail="Producto no encontrado"
            )

        return _read(product)


def crear(datos: ProductoCreate) -> ProductoRead:
    with ProductoUnitOfWork() as uow:
        categoria = uow.session.get(
            Categoria,
            datos.categoria_id
        )

        _validate_category(categoria)

        product = Producto(
            **datos.model_dump(),
            activo=True
        )

        uow.productos.add(product)

        return _read(product)


def actualizar(
    producto_id: int,
    datos: ProductoUpdate
) -> ProductoRead:

    with ProductoUnitOfWork() as uow:
        product = uow.productos.get_by_id(producto_id)

        if product is None or not product.activo:
            raise HTTPException(
                status_code=404,
                detail="Producto no encontrado"
            )

        changes = datos.model_dump(exclude_unset=True)

        if (
            "categoria_id" in changes
            and changes["categoria_id"] is not None
        ):
            categoria = uow.session.get(
                Categoria,
                changes["categoria_id"]
            )

            _validate_category(categoria)

        for key, value in changes.items():
            if value is not None:
                setattr(product, key, value)

        uow.session.add(product)
        uow.session.flush()

        return _read(product)


def actualizar_stock(
    producto_id: int,
    stock: int,
    disponible: bool
) -> ProductoRead:

    with ProductoUnitOfWork() as uow:
        product = uow.productos.get_by_id(producto_id)

        if product is None or not product.activo:
            raise HTTPException(
                status_code=404,
                detail="Producto no encontrado"
            )

        product.stock = stock
        product.disponible = disponible

        uow.session.add(product)
        uow.session.flush()

        return _read(product)


def eliminar(producto_id: int) -> None:
    with ProductoUnitOfWork() as uow:
        product = uow.productos.get_by_id(producto_id)

        if product is None or not product.activo:
            raise HTTPException(
                status_code=404,
                detail="Producto no encontrado"
            )

        product.activo = False
        uow.session.add(product)
