"""Schemas Pydantic para o dominio de reviews.

Separados em Create / Update / Response / ListResponse seguindo o mesmo
padrao dos demais dominios (auth, user, movie).
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublicResponse


class ReviewMovieSummary(BaseModel):
    """Resumo do filme embutido na review (evita join completo de Movie)."""

    id: int
    title: str
    poster_path: Optional[str] = None
    release_year: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewCreate(BaseModel):
    """Payload para criacao de uma review.

    O movie_id vem da rota (path), nao do corpo. content e obrigatorio;
    rating, title e is_public sao opcionais.
    """

    content: str = Field(..., min_length=1, max_length=10000, description="Texto da review")
    rating: Optional[float] = Field(
        default=None, ge=1, le=5, description="Nota de 1 a 5 estrelas"
    )
    title: Optional[str] = Field(default=None, max_length=255)
    is_public: bool = Field(default=True)


class ReviewUpdate(BaseModel):
    """Payload para atualizacao parcial de uma review.

    Todos os campos sao opcionais; apenas os enviados sao alterados
    (model_dump(exclude_unset=True) no service).
    """

    content: Optional[str] = Field(default=None, min_length=1, max_length=10000)
    rating: Optional[float] = Field(default=None, ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=255)
    is_public: Optional[bool] = None


class ReviewResponse(BaseModel):
    """Resposta completa de uma review, com dados do autor e do filme."""

    id: UUID
    user_id: UUID
    movie_id: int
    content: str
    rating: Optional[float] = None
    title: Optional[str] = None
    is_public: bool
    created_at: datetime
    updated_at: datetime
    user: UserPublicResponse
    movie: ReviewMovieSummary

    model_config = ConfigDict(from_attributes=True)


class ReviewListResponse(BaseModel):
    """Listagem paginada de reviews com metadados de paginacao."""

    results: list[ReviewResponse]
    total: int
    skip: int
    limit: int
