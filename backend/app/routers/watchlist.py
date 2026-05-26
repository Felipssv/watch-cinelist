"""Router de watchlist: estado pessoal de tracking de filmes por usuario.

Todas as rotas exigem autenticacao e operam exclusivamente sobre a watchlist
do usuario logado. A entrada e identificada na rota pelo movie_id, pois o par
(user_id, movie_id) e unico.

Endpoints:
- POST   /watchlist              adicionar filme a watchlist (autenticado)
- GET    /watchlist              listar entradas do usuario (paginado, filtros)
- GET    /watchlist/{movie_id}   buscar entrada especifica (autenticado)
- PATCH  /watchlist/{movie_id}   atualizar parcialmente a entrada (autenticado)
- DELETE /watchlist/{movie_id}   remover entrada (autenticado)
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, WatchStatus
from app.schemas.watchlist import (
    WatchlistEntryCreate,
    WatchlistEntryResponse,
    WatchlistEntryUpdate,
    WatchlistListResponse,
)
from app.services import watchlist_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.post(
    "",
    response_model=WatchlistEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_to_watchlist(
    payload: WatchlistEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WatchlistEntryResponse:
    """Adiciona um filme a watchlist do usuario autenticado.

    Erros:
    - 404 se o filme nao existe no banco.
    - 409 se o filme ja esta na watchlist do usuario.
    """
    entry = watchlist_service.add_entry(
        db=db,
        movie_id=payload.movie_id,
        payload=payload,
        current_user=current_user,
    )
    return WatchlistEntryResponse.model_validate(entry)


@router.get(
    "",
    response_model=WatchlistListResponse,
)
async def list_watchlist(
    status_filter: Optional[WatchStatus] = Query(
        default=None, alias="status", description="Filtrar por status de tracking"
    ),
    is_favorite: Optional[bool] = Query(
        default=None, description="Filtrar apenas favoritos / nao-favoritos"
    ),
    skip: int = Query(0, ge=0, description="Itens a pular (paginacao)"),
    limit: int = Query(500, ge=1, le=500, description="Itens por pagina"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WatchlistListResponse:
    """Lista as entradas da watchlist do usuario, paginadas e filtraveis.

    Aceita os filtros opcionais `status` e `is_favorite`. Ordena da entrada
    mais recente para a mais antiga.
    """
    results, total = watchlist_service.list_entries(
        db=db,
        current_user=current_user,
        status_filter=status_filter,
        is_favorite=is_favorite,
        skip=skip,
        limit=limit,
    )
    return WatchlistListResponse(
        results=[WatchlistEntryResponse.model_validate(e) for e in results],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{movie_id}",
    response_model=WatchlistEntryResponse,
)
async def get_watchlist_entry(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WatchlistEntryResponse:
    """Retorna a entrada do usuario para um filme especifico.

    Erro: 404 se o filme nao esta na watchlist do usuario.
    """
    entry = watchlist_service.get_entry(
        db=db, movie_id=movie_id, current_user=current_user
    )
    return WatchlistEntryResponse.model_validate(entry)


@router.patch(
    "/{movie_id}",
    response_model=WatchlistEntryResponse,
)
async def update_watchlist_entry(
    movie_id: int,
    payload: WatchlistEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WatchlistEntryResponse:
    """Atualiza parcialmente a entrada do usuario para um filme.

    Erro: 404 se o filme nao esta na watchlist do usuario.
    """
    entry = watchlist_service.update_entry(
        db=db, movie_id=movie_id, payload=payload, current_user=current_user
    )
    return WatchlistEntryResponse.model_validate(entry)


@router.delete(
    "/{movie_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_watchlist_entry(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove a entrada do usuario para um filme.

    Erro: 404 se o filme nao esta na watchlist do usuario.
    """
    watchlist_service.remove_entry(
        db=db, movie_id=movie_id, current_user=current_user
    )
