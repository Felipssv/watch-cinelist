"""Router de autenticacao: register, login, refresh e me."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.auth import (
    RefreshTokenRequest,
    Token,
    UserLogin,
    UserRegister,
)
from app.schemas.user import AuthResponse, UserResponse
from app.services.auth_service import (
    authenticate_user,
    build_tokens_for_user,
    create_access_token,
    decode_token,
    get_current_user,
    hash_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserRegister, db: Session = Depends(get_db)) -> AuthResponse:
    """Cria um novo usuario e retorna tokens de autenticacao.

    Erros:
    - 409 se email ou username ja estiverem em uso.
    """
    email_lc = payload.email.lower()
    username_lc = payload.username.lower()

    existing = (
        db.query(User)
        .filter((User.email == email_lc) & (User.username == username_lc))
        .first()
    )
    if existing:
        # Mensagem generica: nao expor qual campo conflita (boa pratica de seguranca)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail ou username ja cadastrado",
        )

    user = User(
        email=email_lc,
        username=username_lc,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token, refresh_token = build_tokens_for_user(user)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    """Autentica usuario por email ou username + senha."""
    user = authenticate_user(db, identifier=payload.identifier, password=payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inativo",
        )

    access_token, refresh_token = build_tokens_for_user(user)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=Token)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> Token:
    """Gera novo access_token a partir de um refresh_token valido.

    O refresh_token continua valido ate sua propria expiracao
    (nao ha rotacao de refresh tokens nesta versao).
    """
    token_data = decode_token(payload.refresh_token, expected_type="refresh")

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario invalido para refresh",
            headers={"WWW-Authenticate": "Bearer"},
        )

    new_access = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=new_access, token_type="bearer")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Retorna o perfil do usuario autenticado."""
    return UserResponse.model_validate(current_user)
