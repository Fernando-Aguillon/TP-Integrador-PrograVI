from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.core.database import get_session
from app.modules.usuarios.models import Usuario
from app.core.security import JWTError, decode_access_token


class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> str:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado", headers={"WWW-Authenticate": "Bearer"})
        return token


oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/api/v1/auth/token")


def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> Usuario:
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if not subject:
            raise ValueError("JWT without subject")
        user_id = int(subject)
    except (JWTError, TypeError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Credenciales inválidas o sesión vencida", headers={"WWW-Authenticate": "Bearer"}) from error

    usuario = session.get(Usuario, user_id)
    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado", headers={"WWW-Authenticate": "Bearer"})
    return usuario


def get_optional_user(request: Request, session: Session = Depends(get_session)) -> Usuario | None:
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        usuario_id = int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError):
        return None
    usuario = session.get(Usuario, usuario_id)
    return usuario if usuario is not None and not usuario.disabled else None


def get_current_active_user(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if usuario.disabled:
        raise HTTPException(status_code=400, detail="Cuenta de usuario desactivada")
    return usuario


def require_role(roles: list[str]):
    allowed = {role.lower() for role in roles}

    def dependency(usuario: Usuario = Depends(get_current_active_user)) -> Usuario:
        if usuario.role.lower() not in allowed:
            raise HTTPException(status_code=403, detail="No tenés permisos para realizar esta operación")
        return usuario

    return dependency
