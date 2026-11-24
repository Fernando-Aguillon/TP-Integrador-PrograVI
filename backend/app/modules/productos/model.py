from sqlalchemy import Column, Numeric
from sqlmodel import Field, Relationship, SQLModel


class Producto(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", index=True, nullable=False)
    nombre: str = Field(index=True, max_length=150, nullable=False)
    descripcion: str = Field(default="", max_length=2000, nullable=False)
    precio_base: float = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    imagen_url: str = Field(default="", max_length=500, nullable=False)
    stock: int = Field(default=0, ge=0, nullable=False)
    disponible: bool = Field(default=True, nullable=False)
    activo: bool = Field(default=True, nullable=False)
    categoria: "Categoria" = Relationship(back_populates="productos")
    detalles: list["DetallePedido"] = Relationship(back_populates="producto")
