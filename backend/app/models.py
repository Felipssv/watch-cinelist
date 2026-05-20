"""Modelos ORM do CineList (SQLAlchemy 2.0 sincrono).

Tabelas: users, genres, movies, movie_genres, watchlist_entries, reviews.
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


class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    username        = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    avatar_url      = Column(String(500), nullable=True)
    bio             = Column(Text, nullable=True)
    is_active       = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at      = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at      = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    entries = relationship("WatchlistEntry", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")


class Genre(Base):
    __tablename__ = "genres"

    id   = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)

    movies = relationship("Movie", secondary="movie_genres", back_populates="genres")


class Movie(Base):
    __tablename__ = "movies"

    id                = Column(Integer, primary_key=True)  # ID do TMDB
    title             = Column(String(500), nullable=False)
    original_title    = Column(String(500))
    poster_path       = Column(String)
    backdrop_path     = Column(String)
    overview          = Column(Text)
    release_year      = Column(Integer)
    tmdb_rating       = Column(Float)
    revenue           = Column(BigInteger, nullable=True)
    budget            = Column(BigInteger, nullable=True)
    runtime           = Column(Integer, nullable=True)
    tagline           = Column(String(500), nullable=True)
    status            = Column(String(50), nullable=True)
    original_language = Column(String(10), nullable=True)
    cached_at         = Column(DateTime, default=datetime.utcnow)

    genres  = relationship("Genre", secondary="movie_genres", back_populates="movies")
    entries = relationship("WatchlistEntry", back_populates="movie")
    reviews = relationship("Review", back_populates="movie")


class MovieGenre(Base):
    __tablename__ = "movie_genres"

    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), primary_key=True)
    genre_id = Column(Integer, ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True)


class WatchStatus(enum.Enum):
    want_to_watch = "want_to_watch"
    watching      = "watching"
    watched       = "watched"
    dropped       = "dropped"


class WatchlistEntry(Base):
    __tablename__ = "watchlist_entries"
    __table_args__ = (
        CheckConstraint("rating >= 0 AND rating <= 10", name="rating_range"),
        UniqueConstraint("user_id", "movie_id", name="uq_watchlist_user_movie"),
        Index("ix_watchlist_user_status", "user_id", "status"),
    )

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    movie_id    = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    status      = Column(Enum(WatchStatus), nullable=False, default=WatchStatus.want_to_watch)
    is_favorite = Column(Boolean, default=False)
    rating      = Column(Float, nullable=True)
    review      = Column(Text, nullable=True)
    notes       = Column(Text, nullable=True)
    watched_at  = Column(DateTime, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user  = relationship("User", back_populates="entries")
    movie = relationship("Movie", back_populates="entries")


class Review(Base):
    """Reviews publicas escritas por usuarios sobre filmes.

    Separada de WatchlistEntry porque uma review e um conteudo publico/social,
    enquanto a watchlist entry guarda o estado pessoal de tracking do filme.
    """

    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 0 AND rating <= 10", name="review_rating_range"),
        UniqueConstraint("user_id", "movie_id", name="uq_review_user_movie"),
        Index("ix_reviews_movie", "movie_id"),
        Index("ix_reviews_user", "user_id"),
    )

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    movie_id   = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    rating     = Column(Float, nullable=True)
    title      = Column(String(255), nullable=True)
    content    = Column(Text, nullable=False)
    is_public  = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user  = relationship("User", back_populates="reviews")
    movie = relationship("Movie", back_populates="reviews")
