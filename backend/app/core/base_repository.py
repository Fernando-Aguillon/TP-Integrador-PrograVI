
from __future__ import annotations

from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select


ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    """Acceso a datos sin decidir cuándo se confirma la transacción."""

    def __init__(self, session: Session, model: type[ModelT]):
        self.session = session
        self.model = model

    def get(self, entity_id: int) -> ModelT | None:
        return self.session.get(self.model, entity_id)

    def get_by_id(self, entity_id: int) -> ModelT | None:
        return self.get(entity_id)

    def list(self) -> list[ModelT]:
        return list(self.session.exec(select(self.model)).all())

    def get_all(self) -> list[ModelT]:
        return self.list()

    def add(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        self.session.flush()
        return entity

    def delete(self, entity: ModelT) -> None:
        self.session.delete(entity)
