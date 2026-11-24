"""Idempotently load the administrator, catalog categories and example products."""

from sqlmodel import Session, select

from app.modules.categorias.model import Categoria
from app.core.config import settings
from app.core.database import create_db_and_tables, engine
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository
from app.core.security import hash_password
from app.modules.productos.model import Producto

INITIAL_CATEGORIES = {
    "Hamburguesas": "Hamburguesas clásicas y especiales",
    "Pizzas": "Pizzas para compartir",
    "Bebidas": "Bebidas frías",
    "Acompañamientos": "Papas y guarniciones",
    "Postres": "Algo dulce para terminar",
}
INITIAL_PRODUCTS = [
    ("Cheeseburger", "Medallón, cheddar, lechuga y salsa de la casa.", 8500, "Hamburguesas"),
    ("Hamburguesa clásica", "Medallón, tomate, lechuga y mayonesa.", 7800, "Hamburguesas"),
    ("Pizza muzzarella", "Muzzarella, salsa de tomate y aceitunas.", 12000, "Pizzas"),
    ("Pizza napolitana", "Muzzarella, tomate fresco y ajo.", 13500, "Pizzas"),
    ("Papas fritas", "Porción de papas fritas crocantes.", 4200, "Acompañamientos"),
    ("Aros de cebolla", "Porción de aros de cebolla crocantes.", 3900, "Acompañamientos"),
    ("Limonada", "Limonada natural de 500 ml.", 2500, "Bebidas"),
    ("Gaseosa cola", "Botella de 500 ml.", 2200, "Bebidas"),
    ("Brownie", "Brownie de chocolate.", 3200, "Postres"),
    ("Cheesecake", "Porción de cheesecake.", 3800, "Postres"),
]


def seed() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        categories: dict[str, Categoria] = {}
        for name, description in INITIAL_CATEGORIES.items():
            category = session.exec(select(Categoria).where(Categoria.nombre == name)).first()
            if category is None:
                category = Categoria(nombre=name, descripcion=description, activo=True)
                session.add(category)
                session.flush()
            categories[name] = category

        for name, description, price, category_name in INITIAL_PRODUCTS:
            if session.exec(select(Producto).where(Producto.nombre == name)).first() is None:
                session.add(Producto(categoria_id=categories[category_name].id, nombre=name, descripcion=description,
                                     precio_base=price, imagen_url="", stock=20, disponible=True, activo=True))

        repository = UsuarioRepository(session)
        admin = repository.get_by_username(settings.admin_username)
        if admin is None:
            admin = repository.get_by_email(settings.admin_email)
            if admin:
                admin.username = settings.admin_username
                admin.full_name = settings.admin_full_name
                admin.role = "admin"
                admin.disabled = False
            else:
                session.add(Usuario(username=settings.admin_username, full_name=settings.admin_full_name,
                                    email=settings.admin_email.strip().lower(),
                                    hashed_password=hash_password(settings.admin_password), role="admin", disabled=False))
        else:
            admin.role = "admin"
            admin.disabled = False
        session.commit()
    print(f"Seed listo. Admin: {settings.admin_username} / {settings.admin_password}")


if __name__ == "__main__":
    seed()
