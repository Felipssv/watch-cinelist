"""Configuracao do SQLAlchemy: engine, session factory e Base declarativa.

Usa SQLAlchemy 2.0 em modo sincrono com psycopg2.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Session:
    """Dependency do FastAPI que abre/fecha uma sessao por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
