from sqlmodel import Field, Relationship, SQLModel


class Categoria(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(index=True, unique=True, min_length=2, max_length=100, nullable=False)
    descripcion: str = Field(default="", max_length=1000, nullable=False)
    activo: bool = Field(default=True, nullable=False)
    productos: list["Producto"] = Relationship(back_populates="categoria")
