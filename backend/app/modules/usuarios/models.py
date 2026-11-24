from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(max_length=50, unique=True, index=True, nullable=False)
    full_name: str = Field(max_length=120, nullable=False)
    email: str = Field(max_length=254, unique=True, index=True, nullable=False)
    hashed_password: str = Field(max_length=255, nullable=False)
    role: str = Field(default="user", max_length=20, nullable=False)
    disabled: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True), nullable=False)
    pedidos: list["Pedido"] = Relationship(back_populates="usuario")
