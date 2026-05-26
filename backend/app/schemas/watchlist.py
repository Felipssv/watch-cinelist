"""Schemas Pydantic para o dominio de watchlist.

Separados em Create / Update / Response / ListResponse seguindo o mesmo
padrao dos demais dominios (auth, user, movie, review).

A WatchlistEntry guarda o estado pessoal de tracking de um filme para um
usuario (status, favorito, nota pessoal). E distinta de Review, que e
conteudo publico/social.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models import WatchStatus


class WatchlistMovieSummary(BaseModel):
    """Resumo do filme embutido na entrada (evita join completo de Movie)."""

    id: int
    title: str
    poster_path: Optional[str] = None
    tmdb_rating: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class WatchlistEntryCreate(BaseModel):
    """Payload para adicionar um filme a watchlist do usuario autenticado.

    O movie_id vem do corpo (POST /watchlist). status, is_favorite, rating,
    review e notes sao opcionais; status assume want_to_watch por padrao.
    """

    movie_id: int = Field(..., gt=0, description="TMDB ID do filme")
    status: WatchStatus = Field(
        default=WatchStatus.want_to_watch,
        description="Estado do tracking do filme",
    )
    is_favorite: bool = Field(default=False, description="Marcar como favorito")
    rating: Optional[float] = Field(
        default=None, ge=0, le=10, description="Nota pessoal de 0 a 10"
    )
    review: Optional[str] = Field(
        default=None, max_length=10000, description="Anotacao pessoal (privada)"
    )
    notes: Optional[str] = Field(
        default=None, max_length=10000, description="Notas adicionais"
    )


class WatchlistEntryUpdate(BaseModel):
    """Payload para atualizacao parcial de uma entrada (PATCH).

    Todos os campos sao opcionais; apenas os enviados sao alterados
    (model_dump(exclude_unset=True) no service).
    """

    status: Optional[WatchStatus] = None
    is_favorite: Optional[bool] = None
    rating: Optional[float] = Field(default=None, ge=0, le=10)
    review: Optional[str] = Field(default=None, max_length=10000)
    notes: Optional[str] = Field(default=None, max_length=10000)
    watched_at: Optional[datetime] = None


class WatchlistEntryResponse(BaseModel):
    """Resposta completa de uma entrada, com resumo do filme embutido."""

    id: UUID
    user_id: UUID
    movie_id: int
    status: WatchStatus
    is_favorite: bool
    rating: Optional[float] = None
    review: Optional[str] = None
    notes: Optional[str] = None
    watched_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    movie: WatchlistMovieSummary

    model_config = ConfigDict(from_attributes=True)


class WatchlistListResponse(BaseModel):
    """Listagem paginada de entradas com metadados de paginacao."""

    results: list[WatchlistEntryResponse]
    total: int
    skip: int
    limit: int
