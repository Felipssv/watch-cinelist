"""Schemas Pydantic para autenticacao (login, register, tokens)."""
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    """Payload para registro de novo usuario."""

    email: EmailStr = Field(..., description="E-mail unico do usuario")
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not all(c.isalnum() or c in ("_", ".") for c in v):
            raise ValueError("username deve conter apenas letras, numeros, '_' ou '.'")
        return v.lower()


class UserLogin(BaseModel):
    """Login aceita email OU username como identificador."""

    identifier: str = Field(..., min_length=3, max_length=255, description="E-mail ou username")
    password: str = Field(..., min_length=1, max_length=128)


class Token(BaseModel):
    """Par de tokens emitido em login/register/refresh."""

    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Payload para renovar o access_token."""

    refresh_token: str


class TokenData(BaseModel):
    """Conteudo decodificado de um JWT (claims internos)."""

    user_id: UUID
    email: Optional[str] = None
    token_type: str = "access"


class UserResponse(BaseModel):
    """Dados publicos do usuario retornados apos autenticacao."""

    id: str
    username: str
    email: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Resposta completa de login/register incluindo dados do usuario."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
