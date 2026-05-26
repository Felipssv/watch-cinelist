"""Modelos ORM do CineList (SQLAlchemy 2.0 sincrono).

Tabelas: users, genres, movies, movie_genres, watchlist_entries, reviews.

Convencoes de nomenclatura:
  - PKs    : <tabela>_pkey   (gerado automaticamente pelo PG)
  - FKs    : fk_<tabela>_<coluna>
  - UQs    : uq_<tabela>_<coluna(s)>
  - CHECKs : ck_<tabela>_<regra>
  - Indexes: ix_<tabela>_<coluna(s)>
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


# ---------------------------------------------------------------------------
# users
# ---------------------------------------------------------------------------

class User(Base):
    """Conta de usuario da plataforma CineList."""

    __tablename__ = "users"
    __table_args__ = (
        # Integridade semantica: email deve conter '@'
        CheckConstraint("email LIKE '%@%'", name="ck_users_email_format"),
        # Campos de texto nao podem ser string vazia
        CheckConstraint("length(trim(email)) > 0",    name="ck_users_email_not_empty"),
        CheckConstraint("length(trim(username)) > 0", name="ck_users_username_not_empty"),
        # Indexes para busca rapida
        Index("ix_users_email",    "email",    unique=True),
        Index("ix_users_username", "username", unique=True),
    )

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    email           = Column(String(255), nullable=False)
    username        = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_url      = Column(String(500), nullable=True)
    bio             = Column(Text, nullable=True)
    is_active       = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at      = Column(
        DateTime, nullable=False,
        default=datetime.utcnow,
        server_default="now()",
    )
    updated_at      = Column(
        DateTime, nullable=False,
        default=datetime.utcnow,
        server_default="now()",
        onupdate=datetime.utcnow,
    )

    entries = relationship(
        "WatchlistEntry", back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reviews = relationship(
        "Review", back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


# ---------------------------------------------------------------------------
# genres
# ---------------------------------------------------------------------------

class Genre(Base):
    """Genero cinematografico (fonte: TMDB)."""

    __tablename__ = "genres"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_genres_name_not_empty"),
        UniqueConstraint("name", name="uq_genres_name"),
    )

    id   = Column(Integer, primary_key=True, nullable=False)
    name = Column(String(100), nullable=False)

    movies = relationship("Movie", secondary="movie_genres", back_populates="genres")


# ---------------------------------------------------------------------------
# movies
# ---------------------------------------------------------------------------

class Movie(Base):
    """Filme cacheado do TMDB. A PK e o proprio TMDB ID (integer)."""

    __tablename__ = "movies"
    __table_args__ = (
        # Integridade semantica
        CheckConstraint("tmdb_rating >= 0 AND tmdb_rating <= 10",          name="ck_movies_tmdb_rating"),
        CheckConstraint("release_year > 1888 AND release_year <= 2028",    name="ck_movies_release_year"),
        CheckConstraint("runtime IS NULL OR runtime > 0",                  name="ck_movies_runtime_positive"),
        CheckConstraint("length(trim(title)) > 0",                         name="ck_movies_title_not_empty"),
        CheckConstraint(
            "avg_user_rating IS NULL OR (avg_user_rating >= 0 AND avg_user_rating <= 10)",
            name="ck_movies_avg_user_rating",
        ),
        # Indexes para filtros e ordenacao
        Index("ix_movies_tmdb_rating",  "tmdb_rating"),
        Index("ix_movies_release_year", "release_year"),
        Index("ix_movies_cached_at",    "cached_at"),
    )

    id                = Column(Integer, primary_key=True, nullable=False)  # TMDB ID
    title             = Column(String(500), nullable=False)
    original_title    = Column(String(500), nullable=True)
    poster_path       = Column(String(500), nullable=True)
    backdrop_path     = Column(String(500), nullable=True)
    overview          = Column(Text, nullable=True)
    release_year      = Column(Integer, nullable=True)
    tmdb_rating       = Column(Float, nullable=True)
    revenue           = Column(BigInteger, nullable=True)
    budget            = Column(BigInteger, nullable=True)
    runtime           = Column(Integer, nullable=True)
    tagline           = Column(String(500), nullable=True)
    status            = Column(String(50), nullable=True)
    original_language = Column(String(10), nullable=True)
    avg_user_rating   = Column(Float, nullable=True)   # mantido pelo trigger
    cached_at         = Column(
        DateTime, nullable=True,
        default=datetime.utcnow,
        server_default="now()",
    )

    genres  = relationship("Genre", secondary="movie_genres", back_populates="movies")
    entries = relationship("WatchlistEntry", back_populates="movie")
    reviews = relationship("Review", back_populates="movie")


# ---------------------------------------------------------------------------
# movie_genres  (tabela de associacao N:N)
# ---------------------------------------------------------------------------

class MovieGenre(Base):
    """Associacao N:N entre Movie e Genre."""

    __tablename__ = "movie_genres"
    __table_args__ = (
        Index("ix_movie_genres_genre_id", "genre_id"),
    )

    movie_id = Column(
        Integer,
        ForeignKey("movies.id", ondelete="CASCADE", onupdate="NO ACTION", name="fk_movie_genres_movie_id"),
        primary_key=True,
        nullable=False,
    )
    genre_id = Column(
        Integer,
        ForeignKey("genres.id", ondelete="RESTRICT", onupdate="NO ACTION", name="fk_movie_genres_genre_id"),
        primary_key=True,
        nullable=False,
    )


# ---------------------------------------------------------------------------
# watchlist_entries
# ---------------------------------------------------------------------------

class WatchStatus(enum.Enum):
    want_to_watch = "want_to_watch"
    watching      = "watching"
    watched       = "watched"
    dropped       = "dropped"


class WatchlistEntry(Base):
    """Entrada da watchlist pessoal do usuario para um filme."""

    __tablename__ = "watchlist_entries"
    __table_args__ = (
        # Integridade semantica
        CheckConstraint("rating IS NULL OR (rating >= 0 AND rating <= 10)", name="ck_watchlist_rating_range"),
        # Integridade de entidade: sem duplicatas
        UniqueConstraint("user_id", "movie_id", name="uq_watchlist_user_movie"),
        # Indexes
        Index("ix_watchlist_user_status",    "user_id", "status"),
        Index("ix_watchlist_entries_user_id",  "user_id"),
        Index("ix_watchlist_entries_movie_id", "movie_id"),
    )

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id     = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE", onupdate="NO ACTION", name="fk_watchlist_entries_user_id"),
        nullable=False,
    )
    movie_id    = Column(
        Integer,
        ForeignKey("movies.id", ondelete="CASCADE", onupdate="NO ACTION", name="fk_watchlist_entries_movie_id"),
        nullable=False,
    )
    status      = Column(
        Enum(WatchStatus, name="watchstatus"),
        nullable=False,
        default=WatchStatus.want_to_watch,
        server_default="want_to_watch",
    )
    is_favorite = Column(Boolean, nullable=False, default=False, server_default="false")
    rating      = Column(Float, nullable=True)
    review      = Column(Text, nullable=True)
    notes       = Column(Text, nullable=True)
    watched_at  = Column(DateTime, nullable=True)
    created_at  = Column(
        DateTime, nullable=False,
        default=datetime.utcnow,
        server_default="now()",
    )
    updated_at  = Column(
        DateTime, nullable=False,
        default=datetime.utcnow,
        server_default="now()",
        onupdate=datetime.utcnow,
    )

    user  = relationship("User",  back_populates="entries")
    movie = relationship("Movie", back_populates="entries")


# ---------------------------------------------------------------------------
# reviews
# ---------------------------------------------------------------------------

class Review(Base):
    """Review publica escrita por um usuario sobre um filme.

    Separada de WatchlistEntry porque review e conteudo publico/social,
    enquanto a watchlist entry guarda o estado pessoal de tracking.
    """

    __tablename__ = "reviews"
    __table_args__ = (
        # Integridade semantica: rating de 0 a 10 (ou nulo)
        CheckConstraint(
            "rating IS NULL OR (rating >= 0 AND rating <= 10)",
            name="ck_reviews_rating_range",
        ),
        CheckConstraint("length(trim(content)) > 0", name="ck_reviews_content_not_empty"),
        # Integridade de entidade: um usuario so pode ter uma review por filme
        UniqueConstraint("user_id", "movie_id", name="uq_review_user_movie"),
        # Indexes
        Index("ix_reviews_movie_id", "movie_id"),
        Index("ix_reviews_user_id",  "user_id"),
        Index("ix_reviews_created_at", "created_at"),
    )

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id    = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE", onupdate="NO ACTION", name="fk_reviews_user_id"),
        nullable=False,
    )
    movie_id   = Column(
        Integer,
        ForeignKey("movies.id", ondelete="CASCADE", onupdate="NO ACTION", name="fk_reviews_movie_id"),
        nullable=False,
    )
    rating     = Column(Float, nullable=True)
    title      = Column(String(255), nullable=True)
    content    = Column(Text, nullable=False)
    is_public  = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(
        DateTime, nullable=False,
        default=datetime.utcnow,
        server_default="now()",
    )
    updated_at = Column(
        DateTime, nullable=False,
        default=datetime.utcnow,
        server_default="now()",
        onupdate=datetime.utcnow,
    )

    user  = relationship("User",  back_populates="reviews")
    movie = relationship("Movie", back_populates="reviews")
