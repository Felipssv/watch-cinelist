"""seed: genres TMDB (dados base)

Revision ID: seed_genres_tmdb
Revises: a1b2c3d4e5f6
Create Date: 2026-05-25 00:00:00.000000

O que esta migracao faz:
  - Popula a tabela `genres` com os 19 generos oficiais do TMDB
    (endpoint /genre/movie/list, lista estavel desde 2016).
  - Usa INSERT ... ON CONFLICT (id) DO NOTHING para garantir idempotencia:
    pode ser executada multiplas vezes sem duplicar dados.

Por que aqui e nao em um script separado:
  - O projeto nao possui um runner CLI dedicado nem um diretorio scripts/.
  - Dados de referencia que sao pre-requisito para o funcionamento correto
    da aplicacao pertencem ao pipeline de migracao, nao ao codigo da app.
  - Roda automaticamente com `alembic upgrade head` junto com as migrações de esquema.

Downgrade:
  - Remove apenas as linhas inseridas por esta migracao (por ID).
  - Nao afeta generos criados organicamente pela aplicacao via TMDB.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "seed_genres_tmdb"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# Generos oficiais TMDB (/genre/movie/list) — lista estavel desde 2016.
# Fonte: https://developer.themoviedb.org/reference/genre-movie-list
# ---------------------------------------------------------------------------
TMDB_GENRES: list[dict] = [
    {"id": 28,    "name": "Ação"},
    {"id": 12,    "name": "Aventura"},
    {"id": 16,    "name": "Animação"},
    {"id": 35,    "name": "Comédia"},
    {"id": 80,    "name": "Crime"},
    {"id": 99,    "name": "Documentário"},
    {"id": 18,    "name": "Drama"},
    {"id": 10751, "name": "Família"},
    {"id": 14,    "name": "Fantasia"},
    {"id": 36,    "name": "História"},
    {"id": 27,    "name": "Terror"},
    {"id": 10402, "name": "Música"},
    {"id": 9648,  "name": "Mistério"},
    {"id": 10749, "name": "Romance"},
    {"id": 878,   "name": "Ficção científica"},
    {"id": 10770, "name": "Cinema TV"},
    {"id": 53,    "name": "Thriller"},
    {"id": 10752, "name": "Guerra"},
    {"id": 37,    "name": "Faroeste"},
]

# IDs inseridos por esta migracao — usados no downgrade para remocao cirurgica.
_SEEDED_IDS = [g["id"] for g in TMDB_GENRES]


def upgrade() -> None:
    """Insere os generos TMDB como dados base.

    ON CONFLICT (id) DO NOTHING garante idempotencia total:
    executar `alembic upgrade head` multiplas vezes e seguro.
    """
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            INSERT INTO genres (id, name)
            VALUES (:id, :name)
            ON CONFLICT (id) DO NOTHING
            """
        ),
        TMDB_GENRES,
    )


def downgrade() -> None:
    """Remove apenas as linhas inseridas por esta migracao.

    Generos inseridos organicamente pela aplicacao (via fetch de detalhes
    do TMDB) com IDs fora desta lista NAO sao afetados.
    """
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM genres WHERE id = ANY(:ids)"),
        {"ids": _SEEDED_IDS},
    )
