from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_active_user
from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, COOKIE_NAME, COOKIE_SAMESITE, COOKIE_SECURE, create_access_token
from app.modules.auth import schemas, service
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/auth", tags=["Autenticación"])
SessionDep = Annotated[Session, Depends(get_session)]
ActiveUserDep = Annotated[Usuario, Depends(get_current_active_user)]


@router.post("/register", response_model=schemas.UserPublic, status_code=status.HTTP_201_CREATED)
def register(data: schemas.UserCreate):
    return service.register(data)


@router.post("/token")
def login(response: Response, form: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep):
    user = service.authenticate(session, form.username, form.password)
    token, expires_at = create_access_token(str(user.id))
    max_age = int((expires_at - datetime.now(timezone.utc)).total_seconds())
    response.set_cookie(key=COOKIE_NAME, value=token, max_age=max_age or ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                        httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, path="/")
    return {"message": "Login exitoso"}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/", httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE)
    return {"message": "Sesión cerrada"}


@router.get("/me", response_model=schemas.UserPublic)
def me(user: ActiveUserDep):
    return service.current_user(user)
