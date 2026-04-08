from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GenreSchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


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


class MovieResponse(MovieBase):
    backdrop_path: Optional[str] = None
    genres: list[GenreSchema] = []
    cached_at: Optional[datetime] = None

    class Config:
        from_attributes = True