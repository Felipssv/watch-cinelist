"""Schemas Pydantic para o dominio de usuarios."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserResponse(BaseModel):
    """Representacao publica de um usuario (sem dados sensiveis)."""

    id: UUID
    email: EmailStr
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPublicResponse(BaseModel):
    """Versao reduzida para listagens publicas (ex: reviews, comentarios)."""

    id: UUID
    username: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """Payload para atualizacao parcial do perfil."""

    username: Optional[str] = Field(default=None, min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not all(c.isalnum() or c in ("_", ".") for c in v):
            raise ValueError(
                "username deve conter apenas letras, numeros, '_' ou '.'"
            )
        return v.lower()


class PasswordChange(BaseModel):
    """Payload para troca de senha autenticada."""

    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class AuthResponse(BaseModel):
    """Resposta de register/login: dados do usuario + tokens."""

    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
