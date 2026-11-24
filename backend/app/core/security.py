from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from app.core.config import settings

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
COOKIE_NAME = "access_token"
COOKIE_SECURE = settings.cookie_secure
COOKIE_SAMESITE = settings.cookie_samesite


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str) -> tuple[str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode({"sub": subject, "exp": expires_at}, SECRET_KEY, algorithm=ALGORITHM)
    return token, expires_at


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


__all__ = ["JWTError", "COOKIE_NAME", "COOKIE_SECURE", "COOKIE_SAMESITE", "ACCESS_TOKEN_EXPIRE_MINUTES", "create_access_token", "decode_access_token"]
