import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    Text, DateTime, ForeignKey, Enum, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email          = Column(String(255), unique=True, nullable=False)
    username       = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entries = relationship("WatchlistEntry", back_populates="user")


class Genre(Base):
    __tablename__ = "genres"

    id   = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)

    movies = relationship("MovieGenre", back_populates="genre")


class Movie(Base):
    __tablename__ = "movies"

    id             = Column(Integer, primary_key=True)  # ID do TMDB
    title          = Column(String(500), nullable=False)
    original_title = Column(String(500))
    poster_path    = Column(String)
    backdrop_path  = Column(String)
    overview       = Column(Text)
    release_year   = Column(Integer)
    tmdb_rating    = Column(Float)
    cached_at      = Column(DateTime, default=datetime.utcnow)

    genres  = relationship("MovieGenre", back_populates="movie")
    entries = relationship("WatchlistEntry", back_populates="movie")


class MovieGenre(Base):
    __tablename__ = "movie_genres"

    movie_id = Column(Integer, ForeignKey("movies.id"), primary_key=True)
    genre_id = Column(Integer, ForeignKey("genres.id"), primary_key=True)

    movie = relationship("Movie", back_populates="genres")
    genre = relationship("Genre", back_populates="movies")


class WatchStatus(enum.Enum):
    want_to_watch = "want_to_watch"
    watching      = "watching"
    watched       = "watched"
    dropped       = "dropped"


class WatchlistEntry(Base):
    __tablename__ = "watchlist_entries"
    __table_args__ = (
        CheckConstraint("rating >= 0 AND rating <= 10", name="rating_range"),
    )

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    movie_id    = Column(Integer, ForeignKey("movies.id"), nullable=False)
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