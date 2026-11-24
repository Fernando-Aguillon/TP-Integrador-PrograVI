from typing import Annotated

from fastapi import APIRouter, Depends, Path, Response, status
from sqlmodel import Session

from app.modules.categorias import schema, service
from app.core.database import get_session
from app.core.deps import require_role
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/categorias", tags=["Categorías"])
SessionDep = Annotated[Session, Depends(get_session)]
AdminDep = Annotated[Usuario, Depends(require_role(["admin"]))]


@router.get("/", response_model=list[schema.CategoriaRead])
def listar_categorias(session: SessionDep):
    return service.listar(session)


@router.get("/{categoria_id}", response_model=schema.CategoriaRead)
def obtener_categoria(categoria_id: Annotated[int, Path(gt=0)], session: SessionDep):
    return service.obtener(session, categoria_id)


@router.post("/", response_model=schema.CategoriaRead, status_code=status.HTTP_201_CREATED)
def crear_categoria(datos: schema.CategoriaCreate, _admin: AdminDep):
    return service.crear(datos)


@router.put("/{categoria_id}", response_model=schema.CategoriaRead)
def actualizar_categoria(datos: schema.CategoriaCreate, categoria_id: Annotated[int, Path(gt=0)], _admin: AdminDep):
    return service.actualizar(categoria_id, datos)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_categoria(categoria_id: Annotated[int, Path(gt=0)], _admin: AdminDep):
    service.eliminar(categoria_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
