"""Configuracoes centralizadas da aplicacao usando pydantic-settings.

Todas as variaveis sensiveis (DATABASE_URL, SECRET_KEY, TMDB_API_KEY) sao
carregadas a partir do arquivo .env na raiz do projeto backend.
"""
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuracoes globais da aplicacao."""

    # Banco de dados
    DATABASE_URL: str = Field(..., description="String de conexao do PostgreSQL")

    # JWT / Autenticacao
    SECRET_KEY: str = Field(..., description="Chave para assinar tokens JWT")
    ALGORITHM: str = Field(default="HS256", description="Algoritmo do JWT")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60, description="Tempo de vida do access token em minutos"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7, description="Tempo de vida do refresh token em dias"
    )

    # TMDB API
    TMDB_API_KEY: str = Field(..., description="Bearer token v4 da TMDB API")
    TMDB_BASE_URL: str = Field(
        default="https://api.themoviedb.org/3",
        description="URL base da TMDB API v3",
    )

    # CORS
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173",
        description="Lista de origins permitidas separadas por virgula",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Retorna CORS_ORIGINS como lista de strings."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Retorna instancia singleton de Settings (cache para evitar releitura)."""
    return Settings()


settings = get_settings()
