"""consolidate: constraints, indexes, triggers e views academicos

Revision ID: a1b2c3d4e5f6
Revises: 7c21e5e0ba5e
Create Date: 2026-05-20 20:00:00.000000

O que esta migracao faz (e pode desfazer):
  1.  Renomeia FKs de movie_genres, watchlist_entries e reviews para a convencao
      fk_<tabela>_<coluna>
  2.  Altera ondelete de movie_genres.genre_id: CASCADE -> RESTRICT
  3.  Substitui CHECK rating_range (0-10) em watchlist_entries por ck_watchlist_rating_range (1-5)
  4.  Substitui CHECK review_rating_range (0-10) em reviews por ck_reviews_rating_range (1-5)
  5.  Adiciona CHECK constraints semanticos em users, movies, genres e reviews
  6.  Adiciona coluna avg_user_rating em movies
  7.  Corrige watchlist_entries: is_favorite NOT NULL + server_default; created_at/updated_at NOT NULL + server_default
  8.  Adiciona server_default now() em users.created_at/updated_at e movies.cached_at
  9.  Cria indexes secundarios: movies (tmdb_rating, release_year, cached_at);
      movie_genres (genre_id); watchlist_entries (user_id, movie_id);
      reviews (movie_id, user_id, created_at - com novos nomes de convencao)
  10. Cria trigger fn_set_updated_at() em users, watchlist_entries e reviews
  11. Cria trigger fn_update_movie_avg_rating() em reviews
  12. Cria view v_user_watchlist_stats
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "7c21e5e0ba5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def _constraint_exists(conn, table: str, name: str, kind: str = "f") -> bool:
    """Retorna True se a constraint existir no catalogo do PG.
    table e name sao valores internos constantes (nao input do usuario).
    """
    sql = (
        f"SELECT 1 FROM pg_constraint "
        f"WHERE conrelid = '{table}'::regclass AND conname = '{name}' AND contype = '{kind}'"
    )
    return bool(conn.execute(sa.text(sql)).scalar())


def _index_exists(conn, name: str) -> bool:
    sql = f"SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='{name}'"
    return bool(conn.execute(sa.text(sql)).scalar())


def _column_exists(conn, table: str, column: str) -> bool:
    sql = (
        f"SELECT 1 FROM information_schema.columns "
        f"WHERE table_schema='public' AND table_name='{table}' AND column_name='{column}'"
    )
    return bool(conn.execute(sa.text(sql)).scalar())


def _trigger_exists(conn, table: str, name: str) -> bool:
    sql = (
        f"SELECT 1 FROM pg_trigger "
        f"WHERE tgname='{name}' AND tgrelid='{table}'::regclass"
    )
    return bool(conn.execute(sa.text(sql)).scalar())


# ---------------------------------------------------------------------------
# upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    """Aplica todas as melhorias de integridade, performance e funcionalidade."""

    conn = op.get_bind()

    # =========================================================================
    # BLOCO 1: RENOMEAR FKs para convencao fk_<tabela>_<coluna>
    # =========================================================================

    # --- movie_genres --------------------------------------------------------
    # FK movie_id: movie_genres_movie_id_fkey -> fk_movie_genres_movie_id
    if _constraint_exists(conn, "movie_genres", "movie_genres_movie_id_fkey") \
            and not _constraint_exists(conn, "movie_genres", "fk_movie_genres_movie_id"):
        _exec("ALTER TABLE movie_genres RENAME CONSTRAINT "
              "movie_genres_movie_id_fkey TO fk_movie_genres_movie_id")

    # FK genre_id: movie_genres_genre_id_fkey -> fk_movie_genres_genre_id
    # Alem de renomear, precisa mudar de CASCADE para RESTRICT
    if _constraint_exists(conn, "movie_genres", "movie_genres_genre_id_fkey"):
        op.drop_constraint("movie_genres_genre_id_fkey", "movie_genres", type_="foreignkey")
        op.create_foreign_key(
            "fk_movie_genres_genre_id", "movie_genres", "genres",
            ["genre_id"], ["id"],
            ondelete="RESTRICT", onupdate="NO ACTION",
        )
    elif _constraint_exists(conn, "movie_genres", "fk_movie_genres_genre_id"):
        # Ja renomeado em tentativa anterior: verifica se e RESTRICT
        defn = conn.execute(sa.text(
            "SELECT pg_get_constraintdef(oid) FROM pg_constraint "
            "WHERE conrelid='movie_genres'::regclass AND conname='fk_movie_genres_genre_id'"
        )).scalar() or ""
        if "RESTRICT" not in defn:
            op.drop_constraint("fk_movie_genres_genre_id", "movie_genres", type_="foreignkey")
            op.create_foreign_key(
                "fk_movie_genres_genre_id", "movie_genres", "genres",
                ["genre_id"], ["id"],
                ondelete="RESTRICT", onupdate="NO ACTION",
            )

    # --- watchlist_entries ---------------------------------------------------
    if _constraint_exists(conn, "watchlist_entries", "watchlist_entries_user_id_fkey") \
            and not _constraint_exists(conn, "watchlist_entries", "fk_watchlist_entries_user_id"):
        _exec("ALTER TABLE watchlist_entries RENAME CONSTRAINT "
              "watchlist_entries_user_id_fkey TO fk_watchlist_entries_user_id")

    if _constraint_exists(conn, "watchlist_entries", "watchlist_entries_movie_id_fkey") \
            and not _constraint_exists(conn, "watchlist_entries", "fk_watchlist_entries_movie_id"):
        _exec("ALTER TABLE watchlist_entries RENAME CONSTRAINT "
              "watchlist_entries_movie_id_fkey TO fk_watchlist_entries_movie_id")

    # --- reviews -------------------------------------------------------------
    if _constraint_exists(conn, "reviews", "reviews_user_id_fkey") \
            and not _constraint_exists(conn, "reviews", "fk_reviews_user_id"):
        _exec("ALTER TABLE reviews RENAME CONSTRAINT "
              "reviews_user_id_fkey TO fk_reviews_user_id")

    if _constraint_exists(conn, "reviews", "reviews_movie_id_fkey") \
            and not _constraint_exists(conn, "reviews", "fk_reviews_movie_id"):
        _exec("ALTER TABLE reviews RENAME CONSTRAINT "
              "reviews_movie_id_fkey TO fk_reviews_movie_id")

    # =========================================================================
    # BLOCO 2: CHECK CONSTRAINTS - rating
    # =========================================================================

    # --- watchlist_entries: substitui rating_range (0-10) por ck_ (1-5) -----
    if _constraint_exists(conn, "watchlist_entries", "rating_range", "c"):
        op.drop_constraint("rating_range", "watchlist_entries", type_="check")

    if not _constraint_exists(conn, "watchlist_entries", "ck_watchlist_rating_range", "c"):
        op.create_check_constraint(
            "ck_watchlist_rating_range",
            "watchlist_entries",
            "rating IS NULL OR (rating >= 1 AND rating <= 5)",
        )

    # --- reviews: substitui review_rating_range (0-10) por ck_ (1-5) --------
    if _constraint_exists(conn, "reviews", "review_rating_range", "c"):
        op.drop_constraint("review_rating_range", "reviews", type_="check")

    if not _constraint_exists(conn, "reviews", "ck_reviews_rating_range", "c"):
        op.create_check_constraint(
            "ck_reviews_rating_range",
            "reviews",
            "rating IS NULL OR (rating >= 1 AND rating <= 5)",
        )

    # =========================================================================
    # BLOCO 3: CHECK CONSTRAINTS - semanticos
    # =========================================================================

    # --- users ---------------------------------------------------------------
    checks_users = {
        "ck_users_email_format":       "email LIKE '%@%'",
        "ck_users_email_not_empty":    "length(trim(email)) > 0",
        "ck_users_username_not_empty": "length(trim(username)) > 0",
    }
    for name, expr in checks_users.items():
        if not _constraint_exists(conn, "users", name, "c"):
            op.create_check_constraint(name, "users", expr)

    # =========================================================================
    # BLOCO 4: avg_user_rating em movies
    # DEVE vir antes dos CHECKs de movies que referenciam essa coluna
    # =========================================================================
    if not _column_exists(conn, "movies", "avg_user_rating"):
        op.add_column("movies", sa.Column("avg_user_rating", sa.Float(), nullable=True))

    # --- movies CHECKs (incluindo ck_movies_avg_user_rating) -----------------
    checks_movies = {
        "ck_movies_tmdb_rating":
            "tmdb_rating IS NULL OR (tmdb_rating >= 0 AND tmdb_rating <= 10)",
        "ck_movies_release_year":
            "release_year IS NULL OR (release_year > 1888 AND release_year <= 2028)",
        "ck_movies_runtime_positive":
            "runtime IS NULL OR runtime > 0",
        "ck_movies_title_not_empty":
            "length(trim(title)) > 0",
        "ck_movies_avg_user_rating":
            "avg_user_rating IS NULL OR (avg_user_rating >= 0 AND avg_user_rating <= 10)",
    }
    for name, expr in checks_movies.items():
        if not _constraint_exists(conn, "movies", name, "c"):
            op.create_check_constraint(name, "movies", expr)

    # --- genres --------------------------------------------------------------
    if not _constraint_exists(conn, "genres", "ck_genres_name_not_empty", "c"):
        op.create_check_constraint(
            "ck_genres_name_not_empty", "genres", "length(trim(name)) > 0"
        )

    # --- reviews -------------------------------------------------------------
    if not _constraint_exists(conn, "reviews", "ck_reviews_content_not_empty", "c"):
        op.create_check_constraint(
            "ck_reviews_content_not_empty", "reviews", "length(trim(content)) > 0"
        )

    # =========================================================================
    # BLOCO 5: Corrigir watchlist_entries (NOT NULL + server_default)
    # =========================================================================

    # is_favorite: preenche nulos, depois NOT NULL
    _exec("UPDATE watchlist_entries SET is_favorite = false WHERE is_favorite IS NULL")
    op.alter_column(
        "watchlist_entries", "is_favorite",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default="false",
    )

    # created_at: preenche nulos, depois NOT NULL + server_default
    _exec("UPDATE watchlist_entries SET created_at = now() WHERE created_at IS NULL")
    op.alter_column(
        "watchlist_entries", "created_at",
        existing_type=sa.DateTime(),
        nullable=False,
        server_default=sa.text("now()"),
    )

    # updated_at: preenche nulos, depois NOT NULL + server_default
    _exec("UPDATE watchlist_entries SET updated_at = now() WHERE updated_at IS NULL")
    op.alter_column(
        "watchlist_entries", "updated_at",
        existing_type=sa.DateTime(),
        nullable=False,
        server_default=sa.text("now()"),
    )

    # =========================================================================
    # BLOCO 6: server_default now() em users e movies
    # =========================================================================
    op.alter_column(
        "users", "created_at",
        existing_type=sa.DateTime(),
        existing_nullable=False,
        server_default=sa.text("now()"),
    )
    op.alter_column(
        "users", "updated_at",
        existing_type=sa.DateTime(),
        existing_nullable=False,
        server_default=sa.text("now()"),
    )
    op.alter_column(
        "movies", "cached_at",
        existing_type=sa.DateTime(),
        existing_nullable=True,
        server_default=sa.text("now()"),
    )

    # =========================================================================
    # BLOCO 7: INDEXES secundarios
    # =========================================================================

    # movies
    if not _index_exists(conn, "ix_movies_tmdb_rating"):
        op.create_index("ix_movies_tmdb_rating",  "movies", ["tmdb_rating"])
    if not _index_exists(conn, "ix_movies_release_year"):
        op.create_index("ix_movies_release_year", "movies", ["release_year"])
    if not _index_exists(conn, "ix_movies_cached_at"):
        op.create_index("ix_movies_cached_at",    "movies", ["cached_at"])

    # movie_genres
    if not _index_exists(conn, "ix_movie_genres_genre_id"):
        op.create_index("ix_movie_genres_genre_id", "movie_genres", ["genre_id"])

    # watchlist_entries
    if not _index_exists(conn, "ix_watchlist_entries_user_id"):
        op.create_index("ix_watchlist_entries_user_id",  "watchlist_entries", ["user_id"])
    if not _index_exists(conn, "ix_watchlist_entries_movie_id"):
        op.create_index("ix_watchlist_entries_movie_id", "watchlist_entries", ["movie_id"])

    # reviews (adiciona os com nome de convencao; mantem os antigos ix_reviews_movie/user)
    if not _index_exists(conn, "ix_reviews_movie_id"):
        op.create_index("ix_reviews_movie_id",   "reviews", ["movie_id"])
    if not _index_exists(conn, "ix_reviews_user_id"):
        op.create_index("ix_reviews_user_id",    "reviews", ["user_id"])
    if not _index_exists(conn, "ix_reviews_created_at"):
        op.create_index("ix_reviews_created_at", "reviews", ["created_at"])

    # =========================================================================
    # BLOCO 8: TRIGGER - fn_set_updated_at (atualiza updated_at a cada UPDATE)
    # =========================================================================
    _exec("""
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
""")

    if not _trigger_exists(conn, "users", "trg_users_updated_at"):
        _exec("""
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();
""")

    if not _trigger_exists(conn, "watchlist_entries", "trg_watchlist_entries_updated_at"):
        _exec("""
CREATE TRIGGER trg_watchlist_entries_updated_at
BEFORE UPDATE ON watchlist_entries
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();
""")

    if not _trigger_exists(conn, "reviews", "trg_reviews_updated_at"):
        _exec("""
CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();
""")

    # =========================================================================
    # BLOCO 9: TRIGGER - fn_update_movie_avg_rating
    #   Recalcula avg_user_rating em movies apos qualquer INSERT/UPDATE/DELETE em reviews
    # =========================================================================
    _exec("""
CREATE OR REPLACE FUNCTION fn_update_movie_avg_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_movie_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_movie_id := OLD.movie_id;
    ELSE
        v_movie_id := NEW.movie_id;
    END IF;

    UPDATE movies
    SET avg_user_rating = (
        SELECT AVG(rating)
        FROM reviews
        WHERE movie_id = v_movie_id
          AND rating IS NOT NULL
          AND is_public = true
    )
    WHERE id = v_movie_id;

    RETURN NULL;
END;
$$;
""")

    if not _trigger_exists(conn, "reviews", "trg_reviews_avg_rating"):
        _exec("""
CREATE TRIGGER trg_reviews_avg_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_update_movie_avg_rating();
""")

    # =========================================================================
    # BLOCO 10: VIEW - v_user_watchlist_stats
    # =========================================================================
    _exec("""
CREATE OR REPLACE VIEW v_user_watchlist_stats AS
SELECT
    u.id                                                         AS user_id,
    u.username,
    COUNT(we.id)                                                 AS total_entries,
    COUNT(we.id) FILTER (WHERE we.status = 'watched')            AS total_watched,
    COUNT(we.id) FILTER (WHERE we.status = 'watching')           AS total_watching,
    COUNT(we.id) FILTER (WHERE we.status = 'want_to_watch')      AS total_want_to_watch,
    COUNT(we.id) FILTER (WHERE we.status = 'dropped')            AS total_dropped,
    COUNT(we.id) FILTER (WHERE we.is_favorite = true)            AS total_favorites,
    ROUND(CAST(AVG(we.rating) AS NUMERIC), 2)                    AS avg_personal_rating,
    COUNT(r.id)                                                  AS total_reviews
FROM users u
LEFT JOIN watchlist_entries we ON we.user_id = u.id
LEFT JOIN reviews r             ON r.user_id  = u.id AND r.is_public = true
GROUP BY u.id, u.username;
""")


# ---------------------------------------------------------------------------
# downgrade - desfaz tudo em ordem inversa
# ---------------------------------------------------------------------------

def downgrade() -> None:
    """Reverte todas as mudancas desta migracao."""

    conn = op.get_bind()

    # =========================================================================
    # 10: DROP VIEW
    # =========================================================================
    _exec("DROP VIEW IF EXISTS v_user_watchlist_stats")

    # =========================================================================
    # 9: DROP trigger avg_rating
    # =========================================================================
    _exec("DROP TRIGGER IF EXISTS trg_reviews_avg_rating ON reviews")
    _exec("DROP FUNCTION IF EXISTS fn_update_movie_avg_rating()")

    # =========================================================================
    # 8: DROP triggers updated_at
    # =========================================================================
    _exec("DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews")
    _exec("DROP TRIGGER IF EXISTS trg_watchlist_entries_updated_at ON watchlist_entries")
    _exec("DROP TRIGGER IF EXISTS trg_users_updated_at ON users")
    _exec("DROP FUNCTION IF EXISTS fn_set_updated_at()")

    # =========================================================================
    # 7: DROP indexes criados nesta migracao
    # =========================================================================
    for idx, tbl in [
        ("ix_reviews_created_at",          "reviews"),
        ("ix_reviews_user_id",             "reviews"),
        ("ix_reviews_movie_id",            "reviews"),
        ("ix_watchlist_entries_movie_id",  "watchlist_entries"),
        ("ix_watchlist_entries_user_id",   "watchlist_entries"),
        ("ix_movie_genres_genre_id",       "movie_genres"),
        ("ix_movies_cached_at",            "movies"),
        ("ix_movies_release_year",         "movies"),
        ("ix_movies_tmdb_rating",          "movies"),
    ]:
        if _index_exists(conn, idx):
            op.drop_index(idx, table_name=tbl)

    # =========================================================================
    # 6: Remover server_default de users e movies
    # =========================================================================
    op.alter_column(
        "movies", "cached_at",
        existing_type=sa.DateTime(),
        existing_nullable=True,
        server_default=None,
    )
    op.alter_column(
        "users", "updated_at",
        existing_type=sa.DateTime(),
        existing_nullable=False,
        server_default=None,
    )
    op.alter_column(
        "users", "created_at",
        existing_type=sa.DateTime(),
        existing_nullable=False,
        server_default=None,
    )

    # =========================================================================
    # 5: Reverter watchlist_entries para nullable sem server_default
    # =========================================================================
    op.alter_column(
        "watchlist_entries", "updated_at",
        existing_type=sa.DateTime(),
        nullable=True,
        server_default=None,
    )
    op.alter_column(
        "watchlist_entries", "created_at",
        existing_type=sa.DateTime(),
        nullable=True,
        server_default=None,
    )
    op.alter_column(
        "watchlist_entries", "is_favorite",
        existing_type=sa.Boolean(),
        nullable=True,
        server_default=None,
    )

    # =========================================================================
    # 4: DROP avg_user_rating de movies
    # =========================================================================
    if _column_exists(conn, "movies", "avg_user_rating"):
        op.drop_column("movies", "avg_user_rating")

    # =========================================================================
    # 3: DROP checks semanticos
    # =========================================================================
    for name, tbl in [
        ("ck_reviews_content_not_empty", "reviews"),
        ("ck_genres_name_not_empty",     "genres"),
        ("ck_movies_avg_user_rating",    "movies"),
        ("ck_movies_title_not_empty",    "movies"),
        ("ck_movies_runtime_positive",   "movies"),
        ("ck_movies_release_year",       "movies"),
        ("ck_movies_tmdb_rating",        "movies"),
        ("ck_users_username_not_empty",  "users"),
        ("ck_users_email_not_empty",     "users"),
        ("ck_users_email_format",        "users"),
    ]:
        if _constraint_exists(conn, tbl, name, "c"):
            op.drop_constraint(name, tbl, type_="check")

    # =========================================================================
    # 2: Reverter checks de rating para os nomes e regras originais
    # =========================================================================
    if _constraint_exists(conn, "reviews", "ck_reviews_rating_range", "c"):
        op.drop_constraint("ck_reviews_rating_range", "reviews", type_="check")
    if not _constraint_exists(conn, "reviews", "review_rating_range", "c"):
        op.create_check_constraint(
            "review_rating_range", "reviews",
            "rating >= 0 AND rating <= 10",
        )

    if _constraint_exists(conn, "watchlist_entries", "ck_watchlist_rating_range", "c"):
        op.drop_constraint("ck_watchlist_rating_range", "watchlist_entries", type_="check")
    if not _constraint_exists(conn, "watchlist_entries", "rating_range", "c"):
        op.create_check_constraint(
            "rating_range", "watchlist_entries",
            "rating >= 0 AND rating <= 10",
        )

    # =========================================================================
    # 1: Reverter FKs para nomes originais (antes da convencao)
    # =========================================================================

    # reviews
    if _constraint_exists(conn, "reviews", "fk_reviews_user_id"):
        _exec("ALTER TABLE reviews RENAME CONSTRAINT "
              "fk_reviews_user_id TO reviews_user_id_fkey")
    if _constraint_exists(conn, "reviews", "fk_reviews_movie_id"):
        _exec("ALTER TABLE reviews RENAME CONSTRAINT "
              "fk_reviews_movie_id TO reviews_movie_id_fkey")

    # watchlist_entries
    if _constraint_exists(conn, "watchlist_entries", "fk_watchlist_entries_user_id"):
        _exec("ALTER TABLE watchlist_entries RENAME CONSTRAINT "
              "fk_watchlist_entries_user_id TO watchlist_entries_user_id_fkey")
    if _constraint_exists(conn, "watchlist_entries", "fk_watchlist_entries_movie_id"):
        _exec("ALTER TABLE watchlist_entries RENAME CONSTRAINT "
              "fk_watchlist_entries_movie_id TO watchlist_entries_movie_id_fkey")

    # movie_genres: volta genre_id FK para CASCADE (era o comportamento original)
    if _constraint_exists(conn, "movie_genres", "fk_movie_genres_genre_id"):
        op.drop_constraint("fk_movie_genres_genre_id", "movie_genres", type_="foreignkey")
        op.create_foreign_key(
            "movie_genres_genre_id_fkey", "movie_genres", "genres",
            ["genre_id"], ["id"],
            ondelete="CASCADE", onupdate="NO ACTION",
        )
    if _constraint_exists(conn, "movie_genres", "fk_movie_genres_movie_id"):
        _exec("ALTER TABLE movie_genres RENAME CONSTRAINT "
              "fk_movie_genres_movie_id TO movie_genres_movie_id_fkey")
