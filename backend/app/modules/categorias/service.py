
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.modules.categorias.model import Categoria
from app.modules.categorias.schema import CategoriaCreate, CategoriaRead
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


def _obtener_categoria(
    uow: CategoriaUnitOfWork,
    categoria_id: int
) -> Categoria:
    categoria = uow.categorias.get_by_id(categoria_id)

    if categoria is None or not categoria.activo:
        raise HTTPException(
            status_code=404,
            detail="Categoría no encontrada"
        )

    return categoria


def listar() -> list[CategoriaRead]:
    with CategoriaUnitOfWork() as uow:
        categorias = uow.categorias.list_active()

        return [
            CategoriaRead.model_validate(categoria)
            for categoria in categorias
        ]


def obtener(categoria_id: int) -> CategoriaRead:
    with CategoriaUnitOfWork() as uow:
        categoria = _obtener_categoria(uow, categoria_id)

        return CategoriaRead.model_validate(categoria)


def crear(datos: CategoriaCreate) -> CategoriaRead:
    try:
        with CategoriaUnitOfWork() as uow:
            existing = uow.categorias.get_by_nombre(
                datos.nombre.strip()
            )

            if existing:
                raise HTTPException(
                    status_code=409,
                    detail="Ya existe una categoría con ese nombre"
                )

            categoria = Categoria(
                nombre=datos.nombre.strip(),
                descripcion=datos.descripcion.strip(),
                activo=True
            )

            uow.categorias.add(categoria)

            return CategoriaRead.model_validate(categoria)

    except IntegrityError as error:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una categoría con ese nombre"
        ) from error


def actualizar(
    categoria_id: int,
    datos: CategoriaCreate
) -> CategoriaRead:
    try:
        with CategoriaUnitOfWork() as uow:
            categoria = _obtener_categoria(uow, categoria_id)

            existing = uow.categorias.get_by_nombre(
                datos.nombre.strip()
            )

            if existing is not None and existing.id != categoria_id:
                raise HTTPException(
                    status_code=409,
                    detail="Ya existe una categoría con ese nombre"
                )

            categoria.nombre = datos.nombre.strip()
            categoria.descripcion = datos.descripcion.strip()

            uow.session.add(categoria)
            uow.session.flush()

            return CategoriaRead.model_validate(categoria)

    except IntegrityError as error:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una categoría con ese nombre"
        ) from error


def eliminar(categoria_id: int) -> None:
    with CategoriaUnitOfWork() as uow:
        categoria = _obtener_categoria(uow, categoria_id)

        categoria.activo = False
        uow.session.add(categoria)
