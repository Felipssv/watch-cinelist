"""Servico de reviews: regras de negocio e acesso ao banco.

Routers ficam finos e delegam toda validacao/persistencia para este modulo.
Usa SQLAlchemy 2.0 em modo sincrono (mesmo padrao de auth_service/movies).

Erros de negocio sao convertidos em HTTPException com status apropriado:
- 404  filme ou review inexistente
- 409  usuario ja possui review para o filme (uq_review_user_movie)
- 403  tentativa de editar/remover review de outro usuario
"""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Movie, Review, User
from app.schemas.review import ReviewCreate, ReviewUpdate


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------
def _get_review_or_404(db: Session, review_id: UUID) -> Review:
    """Busca uma review pelo ID ou levanta 404."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review nao encontrada",
        )
    return review


def _ensure_movie_exists(db: Session, movie_id: int) -> None:
    """Garante que o filme existe no banco antes de associar uma review."""
    exists = db.query(Movie.id).filter(Movie.id == movie_id).first()
    if exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filme nao encontrado",
        )


def _ensure_owner(review: Review, current_user: User) -> None:
    """Garante que o usuario autenticado e o autor da review."""
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce nao tem permissao para alterar esta review",
        )


# ---------------------------------------------------------------------------
# Operacoes
# ---------------------------------------------------------------------------
def create_review(
    db: Session,
    movie_id: int,
    payload: ReviewCreate,
    current_user: User,
) -> Review:
    """Cria uma review do usuario autenticado para um filme.

    Valida que o filme existe e que o usuario ainda nao tem review para ele
    (a constraint uq_review_user_movie tambem protege em nivel de banco).
    """
    _ensure_movie_exists(db, movie_id)

    duplicate = (
        db.query(Review.id)
        .filter(Review.user_id == current_user.id, Review.movie_id == movie_id)
        .first()
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Voce ja escreveu uma review para este filme",
        )

    review = Review(
        user_id=current_user.id,
        movie_id=movie_id,
        content=payload.content,
        rating=payload.rating,
        title=payload.title,
        is_public=payload.is_public,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def get_review(db: Session, review_id: UUID) -> Review:
    """Retorna uma review por ID ou 404."""
    return _get_review_or_404(db, review_id)


def list_reviews_by_movie(
    db: Session,
    movie_id: int,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Review], int]:
    """Lista reviews publicas de um filme, paginadas.

    Retorna (resultados, total). Valida que o filme existe para diferenciar
    "filme inexistente" (404) de "filme sem reviews" (lista vazia).
    """
    _ensure_movie_exists(db, movie_id)

    base = db.query(Review).filter(
        Review.movie_id == movie_id,
        Review.is_public.is_(True),
    )
    total = base.count()
    results = (
        base.order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return results, total


def list_reviews_by_user(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 20,
    include_private: bool = False,
) -> tuple[list[Review], int]:
    """Lista reviews de um usuario, paginadas.

    Por padrao retorna apenas reviews publicas. include_private=True
    (usado quando o proprio usuario consulta a si mesmo) traz tambem as
    privadas. Valida que o usuario existe.
    """
    user_exists = db.query(User.id).filter(User.id == user_id).first()
    if user_exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario nao encontrado",
        )

    base = db.query(Review).filter(Review.user_id == user_id)
    if not include_private:
        base = base.filter(Review.is_public.is_(True))

    total = base.count()
    results = (
        base.order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return results, total


def update_review(
    db: Session,
    review_id: UUID,
    payload: ReviewUpdate,
    current_user: User,
) -> Review:
    """Atualiza parcialmente uma review. Apenas o autor pode editar."""
    review = _get_review_or_404(db, review_id)
    _ensure_owner(review, current_user)

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(review, field, value)

    db.commit()
    db.refresh(review)
    return review


def delete_review(
    db: Session,
    review_id: UUID,
    current_user: User,
) -> None:
    """Remove uma review. Apenas o autor pode deletar."""
    review = _get_review_or_404(db, review_id)
    _ensure_owner(review, current_user)

    db.delete(review)
    db.commit()
