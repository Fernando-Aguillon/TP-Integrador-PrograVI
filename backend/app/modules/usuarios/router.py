from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import Session

from app.core.deps import require_role
from app.modules.usuarios import service
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import AdminUserPublic

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios"])
AdminDep = Annotated[Usuario, Depends(require_role(["admin"]))]


@router.get("/", response_model=list[AdminUserPublic])
def listar_usuarios(_admin: AdminDep):
    return service.listar_usuarios()


@router.post("/{usuario_id}/activar", response_model=AdminUserPublic)
def activar_usuario(usuario_id: Annotated[int, Path(gt=0)], _admin: AdminDep):
    return service.cambiar_estado(usuario_id, disabled=False)


@router.post("/{usuario_id}/desactivar", response_model=AdminUserPublic)
def desactivar_usuario(usuario_id: Annotated[int, Path(gt=0)], admin: AdminDep):
    if admin.id == usuario_id:
        raise HTTPException(status_code=400, detail="No podés desactivar tu propia cuenta")
    return service.cambiar_estado(usuario_id, disabled=True)
