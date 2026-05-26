"""Servico de watchlist: regras de negocio e acesso ao banco.

Routers ficam finos e delegam toda validacao/persistencia para este modulo.
Usa SQLAlchemy 2.0 em modo sincrono (mesmo padrao de auth_service/reviews).

A watchlist e o estado pessoal de tracking de um filme por usuario; cada
entrada e unica por (user_id, movie_id) — protegido pela constraint
uq_watchlist_user_movie no banco e por checagem previa aqui.

Erros de negocio sao convertidos em HTTPException com status apropriado:
- 404  filme inexistente ou entrada inexistente para o usuario
- 409  usuario ja possui entrada para o filme (uq_watchlist_user_movie)
"""
from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Movie, User, WatchlistEntry, WatchStatus
from app.schemas.watchlist import WatchlistEntryCreate, WatchlistEntryUpdate


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------
def _ensure_movie_exists(db: Session, movie_id: int) -> None:
    """Garante que o filme existe no banco antes de associar uma entrada."""
    exists = db.query(Movie.id).filter(Movie.id == movie_id).first()
    if exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filme nao encontrado",
        )


def _get_entry_or_404(
    db: Session, movie_id: int, current_user: User
) -> WatchlistEntry:
    """Busca a entrada do usuario para um filme ou levanta 404.

    A entrada e identificada pelo par (user_id, movie_id), que e unico — por
    isso a API expoe o movie_id na rota em vez do id (UUID) da entrada.
    """
    entry = (
        db.query(WatchlistEntry)
        .filter(
            WatchlistEntry.user_id == current_user.id,
            WatchlistEntry.movie_id == movie_id,
        )
        .first()
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada nao encontrada na sua watchlist",
        )
    return entry


# ---------------------------------------------------------------------------
# Operacoes
# ---------------------------------------------------------------------------
def add_entry(
    db: Session,
    movie_id: int,
    payload: WatchlistEntryCreate,
    current_user: User,
) -> WatchlistEntry:
    """Adiciona um filme a watchlist do usuario autenticado.

    Valida que o filme existe e que o usuario ainda nao tem entrada para ele
    (a constraint uq_watchlist_user_movie tambem protege em nivel de banco).
    """
    _ensure_movie_exists(db, movie_id)

    duplicate = (
        db.query(WatchlistEntry.id)
        .filter(
            WatchlistEntry.user_id == current_user.id,
            WatchlistEntry.movie_id == movie_id,
        )
        .first()
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este filme ja esta na sua watchlist",
        )

    entry = WatchlistEntry(
        user_id=current_user.id,
        movie_id=movie_id,
        status=payload.status,
        is_favorite=payload.is_favorite,
        rating=payload.rating,
        review=payload.review,
        notes=payload.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_entry(
    db: Session,
    movie_id: int,
    current_user: User,
) -> WatchlistEntry:
    """Retorna a entrada do usuario para um filme ou 404."""
    return _get_entry_or_404(db, movie_id, current_user)


def list_entries(
    db: Session,
    current_user: User,
    status_filter: Optional[WatchStatus] = None,
    is_favorite: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[WatchlistEntry], int]:
    """Lista as entradas da watchlist do usuario, paginadas.

    Filtros opcionais por status e is_favorite. Retorna (resultados, total),
    ordenados da entrada mais recente para a mais antiga.
    """
    base = db.query(WatchlistEntry).filter(
        WatchlistEntry.user_id == current_user.id
    )
    if status_filter is not None:
        base = base.filter(WatchlistEntry.status == status_filter)
    if is_favorite is not None:
        base = base.filter(WatchlistEntry.is_favorite.is_(is_favorite))

    total = base.count()
    results = (
        base.order_by(WatchlistEntry.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return results, total


def update_entry(
    db: Session,
    movie_id: int,
    payload: WatchlistEntryUpdate,
    current_user: User,
) -> WatchlistEntry:
    """Atualiza parcialmente a entrada do usuario para um filme.

    Apenas os campos enviados sao alterados. A propria query ja restringe a
    entrada ao usuario autenticado, entao nao ha como editar a de outro.
    """
    entry = _get_entry_or_404(db, movie_id, current_user)

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


def remove_entry(
    db: Session,
    movie_id: int,
    current_user: User,
) -> None:
    """Remove a entrada do usuario para um filme.

    A query de busca ja restringe ao usuario autenticado, garantindo que
    ninguem remove entradas de terceiros.
    """
    entry = _get_entry_or_404(db, movie_id, current_user)
    db.delete(entry)
    db.commit()
