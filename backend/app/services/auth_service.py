"""Servico de autenticacao: hashing de senha, JWT e dependency para o usuario atual.

Toda a logica de tokens/JWT mora aqui para que routers fiquem finos e testaveis.
Usa bcrypt direto (mais simples que passlib.context e sem warnings de versao).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.auth import TokenData


# OAuth2 scheme apenas para extrair o header Authorization: Bearer <token>.
# tokenUrl aponta para o endpoint de login (informativo para o Swagger UI).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Gera hash bcrypt de uma senha em texto claro."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto bate com o hash armazenado."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------
def _create_token(
    data: dict[str, Any],
    expires_delta: timedelta,
    token_type: str,
) -> str:
    """Helper interno para criar tokens JWT com expiracao e tipo."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    to_encode.update({
        "exp": now + expires_delta,
        "iat": now,
        "type": token_type,
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Cria um JWT de curta duracao para acesso a endpoints autenticados."""
    expires = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(data, expires, token_type="access")


def create_refresh_token(data: dict[str, Any]) -> str:
    """Cria um JWT de longa duracao para renovar o access_token."""
    expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(data, expires, token_type="refresh")


def decode_token(token: str, expected_type: str = "access") -> TokenData:
    """Decodifica e valida um JWT.

    Lanca HTTPException 401 quando:
    - o token e invalido ou expirado
    - o tipo do token e diferente do esperado
    - o payload nao contem `sub` (user_id)
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais invalidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise credentials_exc

    token_type = payload.get("type", "access")
    if token_type != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token type invalido (esperado '{expected_type}')",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_raw = payload.get("sub")
    if not user_id_raw:
        raise credentials_exc

    try:
        user_id = UUID(str(user_id_raw))
    except (ValueError, TypeError):
        raise credentials_exc

    return TokenData(
        user_id=user_id,
        email=payload.get("email"),
        token_type=token_type,
    )


def build_tokens_for_user(user: User) -> tuple[str, str]:
    """Gera par (access_token, refresh_token) com sub/email do usuario."""
    payload = {"sub": str(user.id), "email": user.email}
    return create_access_token(payload), create_refresh_token(payload)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def authenticate_user(db: Session, identifier: str, password: str) -> User | None:
    """Busca usuario por email OU username e valida a senha."""
    identifier_lc = identifier.strip().lower()
    user = (
        db.query(User)
        .filter((User.email == identifier_lc) | (User.username == identifier_lc))
        .first()
    )
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency: extrai o usuario logado a partir do header Authorization."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = decode_token(token, expected_type="access")
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario nao encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inativo",
        )
    return user


def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Dependency opcional: retorna o usuario logado ou None.

    Util em endpoints publicos cujo comportamento muda quando ha um usuario
    autenticado (ex: listar reviews privadas do proprio autor). Diferente de
    get_current_user, nao levanta 401 quando o token esta ausente ou invalido.
    """
    if not token:
        return None
    try:
        token_data = decode_token(token, expected_type="access")
    except HTTPException:
        return None

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None or not user.is_active:
        return None
    return user
