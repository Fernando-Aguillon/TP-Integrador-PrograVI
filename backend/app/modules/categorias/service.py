from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.modules.categorias.model import Categoria
from app.modules.categorias.schema import CategoriaCreate, CategoriaRead
from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


def listar(session: Session) -> list[CategoriaRead]:
    return [CategoriaRead.model_validate(row) for row in CategoriaRepository(session).list_active()]


def obtener(session: Session, categoria_id: int) -> Categoria:
    categoria = session.get(Categoria, categoria_id)
    if categoria is None or not categoria.activo:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria


def crear(datos: CategoriaCreate) -> CategoriaRead:
    try:
        with CategoriaUnitOfWork() as uow:
            existing = uow.categorias.get_by_nombre(datos.nombre.strip())
            if existing:
                raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre")
            categoria = Categoria(nombre=datos.nombre.strip(), descripcion=datos.descripcion.strip(), activo=True)
            uow.session.add(categoria)
            uow.session.flush()
            result = CategoriaRead.model_validate(categoria)
    except IntegrityError as error:
        raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre") from error
    return result


def actualizar(categoria_id: int, datos: CategoriaCreate) -> CategoriaRead:
    try:
        with CategoriaUnitOfWork() as uow:
            categoria = obtener(uow.session, categoria_id)
            existing = uow.categorias.get_by_nombre(datos.nombre.strip())
            if existing:
                raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre")
            categoria.nombre = datos.nombre.strip()
            categoria.descripcion = datos.descripcion.strip()
            uow.session.add(categoria)
            result = CategoriaRead.model_validate(categoria)
    except IntegrityError as error:
        raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre") from error
    return result


def eliminar(categoria_id: int) -> None:
    with CategoriaUnitOfWork() as uow:
        categoria = obtener(uow.session, categoria_id)
        categoria.activo = False
        uow.session.add(categoria)


