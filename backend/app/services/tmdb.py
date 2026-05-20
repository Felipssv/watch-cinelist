"""Cliente HTTP assincrono para a TMDB API com tratamento centralizado de erros.

Erros HTTP/rede sao convertidos para HTTPException apropriadas:
- TMDB 404      -> HTTPException 404 (filme/recurso nao encontrado)
- TMDB 401/403  -> HTTPException 502 (problema de credencial nossa, mas externo)
- timeout/rede  -> HTTPException 504 (gateway timeout)
- demais erros  -> HTTPException 502 (bad gateway)
"""
import logging
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)

API_KEY = settings.TMDB_API_KEY
BASE_URL = settings.TMDB_BASE_URL.rstrip("/")
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Accept": "application/json"}

DEFAULT_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


async def _request(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """Executa uma chamada GET na TMDB e mapeia erros para HTTPException."""
    url = f"{BASE_URL}{path}"
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.get(url, headers=HEADERS, params=params)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as exc:
        code = exc.response.status_code
        logger.warning(
            "TMDB respondeu %s para %s params=%s body=%s",
            code, path, params, exc.response.text[:200],
        )
        if code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recurso nao encontrado na TMDB",
            )
        if code in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Credencial da TMDB invalida ou sem permissao",
            )
        if code == 429:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="TMDB rate limit excedido, tente novamente em instantes",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erro na TMDB (status {code})",
        )

    except httpx.TimeoutException as exc:
        logger.warning("Timeout chamando TMDB %s: %s", path, exc)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Tempo de resposta da TMDB excedido",
        )

    except httpx.RequestError as exc:
        logger.error("Falha de rede chamando TMDB %s: %s", path, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Falha ao comunicar com a TMDB",
        )


async def search_movies(query: str, page: int = 1) -> dict[str, Any]:
    """Busca filmes na TMDB por termo de pesquisa."""
    return await _request(
        "/search/movie",
        params={"query": query, "page": page, "language": "pt-BR"},
    )


async def get_movie_details(tmdb_id: int) -> dict[str, Any]:
    """Detalhes completos de um filme (inclui genres, runtime, budget, revenue)."""
    return await _request(f"/movie/{tmdb_id}", params={"language": "pt-BR"})


async def get_popular_movies(page: int = 1) -> dict[str, Any]:
    return await _request("/movie/popular", params={"page": page, "language": "pt-BR"})


async def get_top_rated_movies(page: int = 1) -> dict[str, Any]:
    return await _request("/movie/top_rated", params={"page": page, "language": "pt-BR"})


async def get_upcoming_movies(page: int = 1) -> dict[str, Any]:
    return await _request("/movie/upcoming", params={"page": page, "language": "pt-BR"})


async def get_now_playing_movies(page: int = 1) -> dict[str, Any]:
    return await _request("/movie/now_playing", params={"page": page, "language": "pt-BR"})
