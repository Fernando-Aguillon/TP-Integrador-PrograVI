from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing import Annotated

NombreCategoria = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]


class CategoriaBase(BaseModel):
    nombre: NombreCategoria = Field(examples=["Tecnología"])
    descripcion: str = Field(default="", max_length=2000, examples=["Artículos electrónicos y accesorios"])


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaRead(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    activo: bool = True
