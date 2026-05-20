"""Router de gerenciamento de perfil do usuario autenticado."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.user import PasswordChange, UserResponse, UserUpdate
from app.services.auth_service import (
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Atualiza parcialmente o perfil do usuario autenticado.

    Campos opcionais: username, email, avatar_url, bio.
    Valida unicidade de email/username antes de aplicar mudancas.
    """
    data = payload.model_dump(exclude_unset=True)

    # Validacao de unicidade quando email ou username sao alterados
    new_email = data.get("email")
    if new_email and new_email.lower() != current_user.email:
        new_email = new_email.lower()
        if db.query(User).filter(User.email == new_email, User.id != current_user.id).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="E-mail ja em uso por outro usuario",
            )
        current_user.email = new_email

    new_username = data.get("username")
    if new_username and new_username != current_user.username:
        if db.query(User).filter(User.username == new_username, User.id != current_user.id).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username ja em uso por outro usuario",
            )
        current_user.username = new_username

    if "avatar_url" in data:
        current_user.avatar_url = data["avatar_url"]
    if "bio" in data:
        current_user.bio = data["bio"]

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Troca a senha do usuario autenticado.

    Exige senha atual correta. Retorna 204 sem corpo em caso de sucesso.
    """
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ser diferente da atual",
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
