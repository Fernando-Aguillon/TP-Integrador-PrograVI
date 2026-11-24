from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from app.modules.categorias.schema import CategoriaRead

NombreProducto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
DescripcionProducto = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]


class ProductoCreate(BaseModel):
    categoria_id: int = Field(gt=0)
    nombre: NombreProducto
    descripcion: DescripcionProducto = ""
    precio_base: float = Field(ge=0)
    imagen_url: str = Field(default="", max_length=500)
    stock: int = Field(default=0, ge=0)
    disponible: bool = True


class ProductoUpdate(BaseModel):
    categoria_id: int | None = Field(default=None, gt=0)
    nombre: NombreProducto | None = None
    descripcion: DescripcionProducto | None = None
    precio_base: float | None = Field(default=None, ge=0)
    imagen_url: str | None = Field(default=None, max_length=500)
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None


class ProductoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    categoria_id: int
    categoria: CategoriaRead
    nombre: str
    descripcion: str
    precio_base: float
    imagen_url: str
    stock: int
    disponible: bool
    activo: bool


class StockUpdate(BaseModel):
    stock: int = Field(ge=0)
    disponible: bool


class ProductoPage(BaseModel):
    total: int
    items: list[ProductoRead]
