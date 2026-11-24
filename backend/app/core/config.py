from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./foodstore.db"
    frontend_origin: str = "http://localhost:5173"
    cors_origins: str = ""
    secret_key: str = "development-only-secret-key-change-before-deploy"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    admin_email: str = "admin@foodstore.com"
    admin_username: str = "admin"
    admin_password: str = "Admin1234!"
    admin_full_name: str = "Administrador Food Store"


settings = Settings()
