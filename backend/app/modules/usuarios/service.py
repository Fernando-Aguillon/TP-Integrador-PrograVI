from fastapi import HTTPException

from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository
from app.modules.usuarios.schemas import AdminUserPublic


def listar_usuarios() -> list[AdminUserPublic]:
    with UnitOfWork() as uow:
        users = UsuarioRepository(uow.session).list()
        return [AdminUserPublic.model_validate(user) for user in users]


def cambiar_estado(usuario_id: int, disabled: bool) -> AdminUserPublic:
    with UnitOfWork() as uow:
        user = UsuarioRepository(uow.session).get_by_id(usuario_id)
        if user is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user.disabled = disabled
        uow.session.add(user)
        uow.session.flush()
        result = AdminUserPublic.model_validate(user)
    return result
