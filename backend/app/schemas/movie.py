"""Schemas Pydantic para o dominio de filmes."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class GenreSchema(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class MovieBase(BaseModel):
    id: int
    title: str
    original_title: Optional[str] = None
    poster_path: Optional[str] = None
    overview: Optional[str] = None
    release_year: Optional[int] = None
    tmdb_rating: Optional[float] = None


class MovieSearchResult(MovieBase):
    pass


class MovieSearchResponse(BaseModel):
    results: list[MovieSearchResult]
    page: int
    total_pages: int


class MovieResponse(MovieBase):
    """Resposta completa do filme, incluindo detalhes financeiros e relacionais."""

    backdrop_path: Optional[str] = None
    runtime: Optional[int] = None
    revenue: Optional[int] = None
    budget: Optional[int] = None
    tagline: Optional[str] = None
    status: Optional[str] = None
    original_language: Optional[str] = None
    genres: list[GenreSchema] = []
    cached_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
