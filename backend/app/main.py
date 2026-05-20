"""Bootstrap da aplicacao FastAPI do CineList."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.routers import auth, movies, users

app = FastAPI(
    title="CineList API",
    description="API de watchlist de filmes integrada a TMDB.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(movies.router)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {"status": "ok", "service": "cinelist-api"}


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    """Health-check simples que valida conexao com o banco."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:  # pragma: no cover
        db_status = f"error: {exc.__class__.__name__}"
    return {"status": "ok", "database": db_status}
