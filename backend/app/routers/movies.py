from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Movie, Genre, MovieGenre
from app.schemas.movie import MovieResponse, MovieSearchResult
from app.services import tmdb

router = APIRouter(prefix="/movies", tags=["movies"])


def _parse_year(release_date: str | None) -> int | None:
    if release_date:
        return int(release_date[:4])
    return None


@router.get("/search", response_model=list[MovieSearchResult])
async def search_movies(q: str, page: int = 1):
    data = await tmdb.search_movies(q, page)

    return [
        MovieSearchResult(
            id=item["id"],
            title=item["title"],
            original_title=item.get("original_title"),
            poster_path=item.get("poster_path"),
            overview=item.get("overview"),
            release_year=_parse_year(item.get("release_date")),
            tmdb_rating=item.get("vote_average"),
        )
        for item in data.get("results", [])
    ]


@router.get("/{tmdb_id}", response_model=MovieResponse)
async def get_movie(tmdb_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == tmdb_id).first()
    if movie:
        return movie

    data = await tmdb.get_movie_details(tmdb_id)

    movie = Movie(
        id=data["id"],
        title=data["title"],
        original_title=data.get("original_title"),
        poster_path=data.get("poster_path"),
        backdrop_path=data.get("backdrop_path"),
        overview=data.get("overview"),
        release_year=_parse_year(data.get("release_date")),
        tmdb_rating=data.get("vote_average"),
        cached_at=datetime.utcnow(),
    )
    db.add(movie)

    for genre_data in data.get("genres", []):
        genre = db.query(Genre).filter(Genre.id == genre_data["id"]).first()
        if not genre:
            genre = Genre(id=genre_data["id"], name=genre_data["name"])
            db.add(genre)
        db.add(MovieGenre(movie_id=movie.id, genre_id=genre.id))

    db.commit()
    db.refresh(movie)
    return movie