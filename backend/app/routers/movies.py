from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Movie, Genre, MovieGenre
from app.schemas.movie import MovieResponse, MovieSearchResult
from app.services import tmdb
from datetime import datetime

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/search", response_model=list[MovieSearchResult])
async def search_movies(q: str, page: int = 1):
    if not q:
        raise HTTPException(status_code=400, detail="Parâmetro q é obrigatório")

    data = await tmdb.search_movies(q, page)
    results = []

    for item in data.get("results", []):
        release_year = None
        if item.get("release_date"):
            release_year = int(item["release_date"][:4])

        results.append(MovieSearchResult(
            id=item["id"],
            title=item["title"],
            original_title=item.get("original_title"),
            poster_path=item.get("poster_path"),
            overview=item.get("overview"),
            release_year=release_year,
            tmdb_rating=item.get("vote_average"),
        ))

    return results


@router.get("/{tmdb_id}", response_model=MovieResponse)
async def get_movie(tmdb_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == tmdb_id).first()

    if movie:
        return movie

    data = await tmdb.get_movie_details(tmdb_id)

    release_year = None
    if data.get("release_date"):
        release_year = int(data["release_date"][:4])

    movie = Movie(
        id=data["id"],
        title=data["title"],
        original_title=data.get("original_title"),
        poster_path=data.get("poster_path"),
        backdrop_path=data.get("backdrop_path"),
        overview=data.get("overview"),
        release_year=release_year,
        tmdb_rating=data.get("vote_average"),
        cached_at=datetime.utcnow(),
    )
    db.add(movie)

    for genre_data in data.get("genres", []):
        genre = db.query(Genre).filter(Genre.id == genre_data["id"]).first()
        if not genre:
            genre = Genre(id=genre_data["id"], name=genre_data["name"])
            db.add(genre)

        movie_genre = MovieGenre(movie_id=movie.id, genre_id=genre.id)
        db.add(movie_genre)

    db.commit()
    db.refresh(movie)
    return movie