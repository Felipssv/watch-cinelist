"""Router de reviews: CRUD publico/social de avaliacoes de filmes.

As rotas cruzam tres recursos (movies, users, reviews), por isso o router
nao usa um prefix unico — cada rota declara seu caminho completo. Tag unica
"reviews" para agrupar no Swagger.

Endpoints:
- POST   /movies/{movie_id}/reviews   criar review (autenticado)
- GET    /movies/{movie_id}/reviews   listar reviews de um filme (paginado)
- GET    /users/{user_id}/reviews     listar reviews de um usuario (paginado)
- GET    /reviews/{review_id}         buscar review por ID
- PUT    /reviews/{review_id}         atualizar review (autenticado, dono)
- DELETE /reviews/{review_id}         deletar review (autenticado, dono)
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.review import (
    ReviewCreate,
    ReviewListResponse,
    ReviewResponse,
    ReviewUpdate,
)
from app.services import review_service
from app.services.auth_service import get_current_user, get_current_user_optional

router = APIRouter(tags=["reviews"])


@router.post(
    "/movies/{movie_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    movie_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewResponse:
    """Cria uma review do usuario autenticado para o filme indicado.

    Erros:
    - 404 se o filme nao existe no banco.
    - 409 se o usuario ja possui uma review para este filme.
    """
    review = review_service.create_review(
        db=db, movie_id=movie_id, payload=payload, current_user=current_user
    )
    return ReviewResponse.model_validate(review)


@router.get(
    "/movies/{movie_id}/reviews",
    response_model=ReviewListResponse,
)
def list_movie_reviews(
    movie_id: int,
    skip: int = Query(0, ge=0, description="Itens a pular (paginacao)"),
    limit: int = Query(20, ge=1, le=100, description="Itens por pagina"),
    db: Session = Depends(get_db),
) -> ReviewListResponse:
    """Lista reviews publicas de um filme, ordenadas da mais recente.

    Erro: 404 se o filme nao existe.
    """
    results, total = review_service.list_reviews_by_movie(
        db=db, movie_id=movie_id, skip=skip, limit=limit
    )
    return ReviewListResponse(
        results=[ReviewResponse.model_validate(r) for r in results],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/users/{user_id}/reviews",
    response_model=ReviewListResponse,
)
def list_user_reviews(
    user_id: UUID,
    skip: int = Query(0, ge=0, description="Itens a pular (paginacao)"),
    limit: int = Query(20, ge=1, le=100, description="Itens por pagina"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> ReviewListResponse:
    """Lista reviews de um usuario, ordenadas da mais recente.

    Mostra apenas reviews publicas, exceto quando o proprio usuario consulta
    a si mesmo (nesse caso inclui as privadas).

    Erro: 404 se o usuario nao existe.
    """
    include_private = current_user is not None and current_user.id == user_id
    results, total = review_service.list_reviews_by_user(
        db=db,
        user_id=user_id,
        skip=skip,
        limit=limit,
        include_private=include_private,
    )
    return ReviewListResponse(
        results=[ReviewResponse.model_validate(r) for r in results],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/reviews/{review_id}",
    response_model=ReviewResponse,
)
def get_review(
    review_id: UUID,
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Retorna uma review especifica por ID.

    Erro: 404 se a review nao existe.
    """
    review = review_service.get_review(db=db, review_id=review_id)
    return ReviewResponse.model_validate(review)


@router.put(
    "/reviews/{review_id}",
    response_model=ReviewResponse,
)
def update_review(
    review_id: UUID,
    payload: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewResponse:
    """Atualiza parcialmente uma review. Apenas o autor pode editar.

    Erros:
    - 404 se a review nao existe.
    - 403 se o usuario autenticado nao e o autor.
    """
    review = review_service.update_review(
        db=db, review_id=review_id, payload=payload, current_user=current_user
    )
    return ReviewResponse.model_validate(review)


@router.delete(
    "/reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_review(
    review_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove uma review. Apenas o autor pode deletar.

    Erros:
    - 404 se a review nao existe.
    - 403 se o usuario autenticado nao e o autor.
    """
    review_service.delete_review(
        db=db, review_id=review_id, current_user=current_user
    )
