from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.core.security import hash_password, verify_password
from app.core.unit_of_work import UnitOfWork
from app.modules.auth.schemas import UserCreate, UserPublic
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository


def register(data: UserCreate) -> UserPublic:
    try:
        with UnitOfWork() as uow:
            repo = UsuarioRepository(uow.session)
            username = data.username.strip()
            email = str(data.email).strip().lower()
            if repo.get_by_username(username):
                raise HTTPException(status_code=409, detail="Ese nombre de usuario ya está registrado")
            if repo.get_by_email(email):
                raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese email")
            user = Usuario(username=username, full_name=data.full_name.strip(), email=email,
                           hashed_password=hash_password(data.password), role="user", disabled=False)
            repo.add(user)
            uow.session.flush()
            result = UserPublic.model_validate(user)
    except IntegrityError as error:
        raise HTTPException(status_code=409, detail="El usuario o email ya está registrado") from error
    return result


def authenticate(session: Session, username: str, password: str) -> Usuario:
    user = UsuarioRepository(session).get_by_username(username.strip())
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos", headers={"WWW-Authenticate": "Bearer"})
    if user.disabled:
        raise HTTPException(status_code=400, detail="Cuenta de usuario desactivada")
    return user


def current_user(user: Usuario) -> UserPublic:
    return UserPublic.model_validate(user)
