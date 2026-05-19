from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Movie, Genre, MovieGenre
from app.schemas.movie import MovieResponse, MovieSearchResult, MovieSearchResponse
from app.services import tmdb

router = APIRouter(prefix="/movies", tags=["movies"])


def _parse_year(release_date: str | None) -> int | None:
    if release_date:
        return int(release_date[:4])
    return None


@router.get("/", response_model=list[MovieResponse])
async def get_movies(db: Session = Depends(get_db)):
    return db.query(Movie).all()


@router.get("/paginated", response_model=MovieSearchResponse)
async def get_paginated_movies(page: int = 1, limit: int = 20, db: Session = Depends(get_db)):
    """Retorna filmes do banco com paginação"""
    # Limitar a página mínima
    page = max(1, page)
    
    # Contar total de filmes
    total_movies = db.query(Movie).count()
    total_pages = (total_movies + limit - 1) // limit  # Arredondar para cima
    
    # Buscar filmes da página
    movies = db.query(Movie).offset((page - 1) * limit).limit(limit).all()
    
    return MovieSearchResponse(
        results=[
            MovieSearchResult(
                id=movie.id,
                title=movie.title,
                original_title=movie.original_title,
                poster_path=movie.poster_path,
                overview=movie.overview,
                release_year=movie.release_year,
                tmdb_rating=movie.tmdb_rating,
            )
            for movie in movies
        ],
        page=page,
        total_pages=total_pages,
    )


@router.get("/bulk-populate", response_model=dict)
async def bulk_populate(pages: int = 5, db: Session = Depends(get_db)):
    """Popula o banco com filmes de múltiplas categorias e páginas"""
    categories = ["popular", "top_rated", "upcoming"]
    total_saved = 0
    
    for category in categories:
        for page in range(1, pages + 1):
            try:
                if category == "popular":
                    data = await tmdb.get_popular_movies(page)
                elif category == "top_rated":
                    data = await tmdb.get_top_rated_movies(page)
                else:
                    data = await tmdb.get_upcoming_movies(page)
                
                for item in data.get("results", []):
                    tmdb_id = item["id"]
                    movie = db.query(Movie).filter(Movie.id == tmdb_id).first()
                    
                    if not movie:
                        movie = Movie(
                            id=tmdb_id,
                            title=item["title"],
                            original_title=item.get("original_title"),
                            poster_path=item.get("poster_path"),
                            backdrop_path=item.get("backdrop_path"),
                            overview=item.get("overview"),
                            release_year=_parse_year(item.get("release_date")),
                            tmdb_rating=item.get("vote_average"),
                            cached_at=datetime.utcnow(),
                        )
                        db.add(movie)
                        total_saved += 1
                
                db.commit()
            except Exception as e:
                print(f"Erro ao buscar {category} página {page}: {e}")
                continue
    
    total_movies = db.query(Movie).count()
    return {
        "message": "Banco populado com sucesso",
        "movies_saved": total_saved,
        "total_movies_in_db": total_movies
    }


@router.get("/search", response_model=MovieSearchResponse)
async def search_movies(
    q: str | None = None, 
    category: str | None = None, 
    page: int = 1, 
    db: Session = Depends(get_db)
):
    """Busca filmes no TMDB (por texto ou categoria) e salva automaticamente no banco"""
    
    # 1. Decide qual função do TMDB chamar com base nos parâmetros
    if q:
        data = await tmdb.search_movies(q, page)
    elif category:
        if category == "popular":
            data = await tmdb.get_popular_movies(page)
        elif category == "top_rated":
            data = await tmdb.get_top_rated_movies(page)
        elif category == "now_playing":
            # Note: Você precisará garantir que esta função exista no seu app/services/tmdb.py
            data = await tmdb.get_now_playing_movies(page)
        else:
            data = await tmdb.get_popular_movies(page) # Fallback seguro
    else:
        # Se não vier nem 'q' nem 'category', retorna os populares por padrão
        data = await tmdb.get_popular_movies(page)
    
    # 2. O resto da lógica continua intacta! Salvando e mapeando os resultados:
    results = []
    for item in data.get("results", []):
        tmdb_id = item["id"]
        # Salva no banco se não existir
        movie = db.query(Movie).filter(Movie.id == tmdb_id).first()
        if not movie:
            movie = Movie(
                id=tmdb_id,
                title=item["title"],
                original_title=item.get("original_title"),
                poster_path=item.get("poster_path"),
                backdrop_path=item.get("backdrop_path"),
                overview=item.get("overview"),
                release_year=_parse_year(item.get("release_date")),
                tmdb_rating=item.get("vote_average"),
                cached_at=datetime.utcnow(),
            )
            db.add(movie)
        
        results.append(MovieSearchResult(
            id=item["id"],
            title=item["title"],
            original_title=item.get("original_title"),
            poster_path=item.get("poster_path"),
            overview=item.get("overview"),
            release_year=_parse_year(item.get("release_date")),
            tmdb_rating=item.get("vote_average"),
        ))
    
    db.commit()
    
    return MovieSearchResponse(
        results=results,
        page=page,
        total_pages=data.get("total_pages", 1),
    )


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