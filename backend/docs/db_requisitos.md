# CineList - Relatorio de Requisitos de Banco de Dados

**Projeto:** CineList - App de Watchlist de Filmes
**Tecnologias:** PostgreSQL, SQLAlchemy ORM, Alembic, FastAPI, Python 3.11+
**Data:** 2026-05-20

---

## 1. Tabelas Completas do Projeto (0.5pt)

### Tabelas existentes no banco

| Tabela              | Descricao                                                        |
|---------------------|------------------------------------------------------------------|
| `users`             | Contas de usuario com autenticacao JWT                           |
| `movies`            | Filmes cacheados do TMDB (The Movie Database)                    |
| `genres`            | Generos cinematograficos (fonte: TMDB)                           |
| `movie_genres`      | Associacao N:N entre filmes e generos                            |
| `watchlist_entries` | Entrada pessoal de cada usuario para um filme (status, rating)   |
| `reviews`           | Reviews publicas escritas por usuarios sobre filmes              |

### Colunas por tabela

**users:**
- `id` UUID PK, `email` VARCHAR(255) UK, `username` VARCHAR(100) UK
- `hashed_password` VARCHAR(255), `avatar_url` VARCHAR(500), `bio` TEXT
- `is_active` BOOLEAN, `created_at` DATETIME, `updated_at` DATETIME

**movies:**
- `id` INTEGER PK (TMDB ID), `title` VARCHAR(500), `original_title` VARCHAR(500)
- `poster_path` VARCHAR(500), `backdrop_path` VARCHAR(500), `overview` TEXT
- `release_year` INTEGER, `tmdb_rating` FLOAT, `revenue` BIGINT, `budget` BIGINT
- `runtime` INTEGER, `tagline` VARCHAR(500), `status` VARCHAR(50)
- `original_language` VARCHAR(10), `avg_user_rating` FLOAT, `cached_at` DATETIME

**genres:**
- `id` INTEGER PK (TMDB genre ID), `name` VARCHAR(100) UK

**movie_genres:**
- `movie_id` INTEGER PK+FK, `genre_id` INTEGER PK+FK

**watchlist_entries:**
- `id` UUID PK, `user_id` UUID FK, `movie_id` INTEGER FK
- `status` ENUM(want_to_watch|watching|watched|dropped)
- `is_favorite` BOOLEAN, `rating` FLOAT, `review` TEXT, `notes` TEXT
- `watched_at` DATETIME, `created_at` DATETIME, `updated_at` DATETIME

**reviews:**
- `id` UUID PK, `user_id` UUID FK, `movie_id` INTEGER FK
- `rating` FLOAT, `title` VARCHAR(255), `content` TEXT, `is_public` BOOLEAN
- `created_at` DATETIME, `updated_at` DATETIME

---

## 2. MER/DER (0.5pt)

O diagrama Entidade-Relacionamento completo em formato Mermaid esta disponivel em:

**`backend/docs/mer.md`**

O diagrama inclui:
- Todas as 6 entidades com seus atributos, tipos e constraints
- Relacionamentos com cardinalidades (1:N, N:N)
- Chaves primarias, estrangeiras e unicas anotadas
- Tabela de associacao `movie_genres` para o relacionamento N:N entre movies e genres

---

## 3. Integridade Semantica (1pt)

Constraints CHECK implementadas para garantir regras de negocio:

### users
| Constraint                  | Expressao SQL                   | Regra de Negocio                |
|-----------------------------|---------------------------------|---------------------------------|
| `ck_users_email_format`     | `email LIKE '%@%'`              | Email deve ter @                |
| `ck_users_email_not_empty`  | `length(trim(email)) > 0`       | Email nao pode ser string vazia |
| `ck_users_username_not_empty`| `length(trim(username)) > 0`   | Username nao pode ser vazio     |

### movies
| Constraint                  | Expressao SQL                                               | Regra de Negocio                       |
|-----------------------------|-------------------------------------------------------------|----------------------------------------|
| `ck_movies_tmdb_rating`     | `tmdb_rating IS NULL OR (tmdb_rating >= 0 AND ... <= 10)`   | Rating TMDB entre 0 e 10               |
| `ck_movies_release_year`    | `release_year IS NULL OR (... > 1888 AND ... <= 2028)`      | Ano > 1888 (primeiro cinema) e <= 2028 |
| `ck_movies_runtime_positive`| `runtime IS NULL OR runtime > 0`                            | Duracao deve ser positiva              |
| `ck_movies_title_not_empty` | `length(trim(title)) > 0`                                   | Titulo nao pode ser string vazia       |
| `ck_movies_avg_user_rating` | `avg_user_rating IS NULL OR (... >= 0 AND ... <= 10)`       | Media de reviews entre 0 e 10          |

### genres
| Constraint                  | Expressao SQL                   | Regra de Negocio              |
|-----------------------------|---------------------------------|-------------------------------|
| `ck_genres_name_not_empty`  | `length(trim(name)) > 0`        | Nome de genero nao pode ser vazio |

### watchlist_entries
| Constraint                    | Expressao SQL                                    | Regra de Negocio               |
|-------------------------------|--------------------------------------------------|--------------------------------|
| `ck_watchlist_rating_range`   | `rating IS NULL OR (rating >= 1 AND rating <= 5)`| Rating pessoal entre 1 e 5 estrelas |

### reviews
| Constraint                      | Expressao SQL                                    | Regra de Negocio                   |
|---------------------------------|--------------------------------------------------|------------------------------------|
| `ck_reviews_rating_range`       | `rating IS NULL OR (rating >= 1 AND rating <= 5)`| Rating de review entre 1 e 5 estrelas |
| `ck_reviews_content_not_empty`  | `length(trim(content)) > 0`                      | Conteudo da review nao pode ser vazio |

**Implementacao:** `backend/app/models.py` (`__table_args__`) + migracao `a1b2c3d4e5f6` (`op.create_check_constraint`)

---

## 4. Integridade de Dominio (1pt)

### Tipos de dados corretos

| Tabela/Coluna                     | Tipo        | Justificativa                                    |
|-----------------------------------|-------------|--------------------------------------------------|
| `users.id`, `watchlist_entries.id`, `reviews.id` | UUID | Ids distribuidos, sem exposicao de sequencia |
| `movies.id`                       | INTEGER     | TMDB usa IDs numericos; evita conversao         |
| `genres.id`                       | INTEGER     | TMDB genre ID e numerico                         |
| `movies.revenue`, `movies.budget` | BIGINT      | Valores em USD podem ultrapassar 2 bilhoes       |
| `movies.tmdb_rating`, `ratings`   | FLOAT       | Notas decimais (ex: 8.5)                         |
| `users.bio`, `review content`     | TEXT        | Texto de tamanho variavel sem limite fixo        |
| `users.hashed_password`           | VARCHAR(255)| BCrypt hash tem 60 chars; 255 protege contra mudancas de algoritmo |
| `watchlist_entries.status`        | ENUM        | Valores controlados: evita strings invalidas     |
| `is_active`, `is_favorite`, `is_public` | BOOLEAN | Semantica binaria clara                        |

### NOT NULL onde semanticamente obrigatorio
- `users`: id, email, username, hashed_password, is_active, created_at, updated_at
- `movies`: id (PK = TMDB ID), title
- `genres`: id, name
- `watchlist_entries`: id, user_id, movie_id, status, is_favorite, created_at, updated_at
- `reviews`: id, user_id, movie_id, content, is_public, created_at, updated_at

### DEFAULT values
| Coluna                         | DEFAULT             |
|--------------------------------|---------------------|
| `users.is_active`              | `true`              |
| `users.created_at`             | `now()`             |
| `users.updated_at`             | `now()`             |
| `movies.cached_at`             | `now()`             |
| `watchlist_entries.status`     | `'want_to_watch'`   |
| `watchlist_entries.is_favorite`| `false`             |
| `watchlist_entries.created_at` | `now()`             |
| `watchlist_entries.updated_at` | `now()`             |
| `reviews.is_public`            | `true`              |
| `reviews.created_at`           | `now()`             |
| `reviews.updated_at`           | `now()`             |

### Limites de tamanho (VARCHAR)
| Coluna                    | Limite | Justificativa                         |
|---------------------------|--------|---------------------------------------|
| `users.email`             | 255    | Padrao RFC 5321                        |
| `users.username`          | 100    | Limite pratico para usernames          |
| `users.hashed_password`   | 255    | BCrypt hash + margem                   |
| `users.avatar_url`        | 500    | URLs tipicas                           |
| `movies.title`            | 500    | Titulos longos em alguns paises        |
| `movies.tagline`          | 500    | Taglines podem ser longas              |
| `movies.status`           | 50     | Valores como "Released", "Post Production" |
| `movies.original_language`| 10     | Codigos ISO 639 (ex: "pt-BR")          |
| `genres.name`             | 100    | Nomes de generos                       |
| `reviews.title`           | 255    | Titulo da review                       |

**Implementacao:** `backend/app/models.py` (definicao dos modelos ORM)

---

## 5. Integridade de Entidade (1pt)

### Primary Keys

| Tabela              | PK                  | Tipo    | Estrategia                         |
|---------------------|---------------------|---------|------------------------------------|
| `users`             | `id`                | UUID    | `uuid.uuid4()` no Python           |
| `movies`            | `id`                | INTEGER | TMDB ID (deduplicacao externa)     |
| `genres`            | `id`                | INTEGER | TMDB genre ID                      |
| `movie_genres`      | (`movie_id`, `genre_id`) | Composta | Chave composta natural           |
| `watchlist_entries` | `id`                | UUID    | `uuid.uuid4()` no Python           |
| `reviews`           | `id`                | UUID    | `uuid.uuid4()` no Python           |

- Todas as PKs sao declaradas com `primary_key=True` e `nullable=False` nos modelos SQLAlchemy
- PKs UUID garantem unicidade global sem exposicao de sequencia
- A PK composta de `movie_genres` garante que a mesma combinacao nao se repita

### Constraints de unicidade (sem duplicatas nas associacoes)

| Tabela              | Constraint              | Colunas             |
|---------------------|-------------------------|---------------------|
| `users`             | `ix_users_email` (UK)   | `email`             |
| `users`             | `ix_users_username` (UK)| `username`          |
| `genres`            | `uq_genres_name`        | `name`              |
| `movie_genres`      | PK composta             | (`movie_id`, `genre_id`) |
| `watchlist_entries` | `uq_watchlist_user_movie`| (`user_id`, `movie_id`) |
| `reviews`           | `uq_review_user_movie`  | (`user_id`, `movie_id`) |

**Implementacao:** `backend/app/models.py` (`UniqueConstraint`, `primary_key=True`)

---

## 6. Integridade Referencial (1pt)

### Foreign Keys com nomes explicitos e comportamento ON DELETE/ON UPDATE

| FK                              | Tabela              | Ref          | ON DELETE | ON UPDATE  |
|---------------------------------|---------------------|--------------|-----------|------------|
| `fk_watchlist_entries_user_id`  | watchlist_entries   | users.id     | CASCADE   | NO ACTION  |
| `fk_watchlist_entries_movie_id` | watchlist_entries   | movies.id    | CASCADE   | NO ACTION  |
| `fk_reviews_user_id`            | reviews             | users.id     | CASCADE   | NO ACTION  |
| `fk_reviews_movie_id`           | reviews             | movies.id    | CASCADE   | NO ACTION  |
| `fk_movie_genres_movie_id`      | movie_genres        | movies.id    | CASCADE   | NO ACTION  |
| `fk_movie_genres_genre_id`      | movie_genres        | genres.id    | RESTRICT  | NO ACTION  |

### Justificativas das regras ON DELETE

- **watchlist_entries -> users CASCADE:** Ao deletar um usuario, toda sua watchlist e removida automaticamente
- **watchlist_entries -> movies CASCADE:** Ao remover um filme do catalogo, as entradas de watchlist associadas sao removidas
- **reviews -> users CASCADE:** Ao deletar um usuario, todas as suas reviews sao removidas
- **reviews -> movies CASCADE:** Ao remover um filme, as reviews associadas sao removidas
- **movie_genres -> movies CASCADE:** Ao remover um filme, as associacoes de genero sao removidas
- **movie_genres -> genres RESTRICT:** Nao permite deletar um genero que ainda possui filmes associados (protege a integridade do catalogo)

**Implementacao:**
- `backend/app/models.py`: `ForeignKey(..., ondelete="CASCADE", name="fk_...")`
- Migracao `a1b2c3d4e5f6`: renomeia FKs anonimas + recria `fk_movie_genres_genre_id` com RESTRICT

---

## 7. Trigger Funcional (0.5pt extra)

### Trigger 1: fn_set_updated_at

**Funcao:** `fn_set_updated_at()`
**Triggers:**
- `trg_users_updated_at` - BEFORE UPDATE em `users`
- `trg_watchlist_entries_updated_at` - BEFORE UPDATE em `watchlist_entries`
- `trg_reviews_updated_at` - BEFORE UPDATE em `reviews`

**Comportamento:** A cada UPDATE em qualquer linha dessas tabelas, o campo `updated_at` e automaticamente atualizado para `now()`. Isso garante que o campo sempre reflita o momento real da ultima modificacao, sem depender do codigo da aplicacao.

**SQL (simplificado):**
```sql
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
```

---

### Trigger 2: fn_update_movie_avg_rating

**Funcao:** `fn_update_movie_avg_rating()`
**Trigger:** `trg_reviews_avg_rating` - AFTER INSERT OR UPDATE OR DELETE em `reviews`

**Comportamento:** Sempre que uma review e inserida, atualizada ou deletada, o trigger recalcula a media das notas publicas (is_public=true) para o filme afetado e atualiza o campo `movies.avg_user_rating`. Isso mantem a media sempre consistente sem necessidade de queries adicionais na aplicacao.

**SQL (simplificado):**
```sql
CREATE OR REPLACE FUNCTION fn_update_movie_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_movie_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_movie_id := OLD.movie_id;
    ELSE
        v_movie_id := NEW.movie_id;
    END IF;

    UPDATE movies
    SET avg_user_rating = (
        SELECT AVG(rating) FROM reviews
        WHERE movie_id = v_movie_id
          AND rating IS NOT NULL AND is_public = true
    )
    WHERE id = v_movie_id;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_reviews_avg_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_update_movie_avg_rating();
```

**Implementacao:** Migracao `a1b2c3d4e5f6`, funcao `upgrade()`, BLOCO 8 e BLOCO 9

---

## 8. Views e Indices (0.5pt extra)

### View: v_user_watchlist_stats

**Descricao:** Agrega estatisticas de watchlist por usuario. Util para dashboards, rankings de usuarios mais ativos, e perfis publicos.

**Colunas:**
- `user_id`, `username`
- `total_entries` - total de filmes na lista
- `total_watched` - filmes assistidos
- `total_watching` - filmes assistindo
- `total_want_to_watch` - filmes para assistir
- `total_dropped` - filmes abandonados
- `total_favorites` - filmes favoritados
- `avg_personal_rating` - media das notas pessoais (ROUND 2 casas)
- `total_reviews` - reviews publicas escritas

**Exemplo de uso:**
```sql
SELECT * FROM v_user_watchlist_stats ORDER BY total_watched DESC;
SELECT * FROM v_user_watchlist_stats WHERE user_id = '<uuid>';
```

---

### Indices

| Index                          | Tabela            | Coluna(s)       | Justificativa                                         |
|--------------------------------|-------------------|-----------------|-------------------------------------------------------|
| `ix_users_email`               | users             | email           | Login por email; busca frequente                      |
| `ix_users_username`            | users             | username        | Login por username; busca frequente                   |
| `ix_movies_tmdb_rating`        | movies            | tmdb_rating     | Ordenacao por nota; filtro de filmes bem avaliados    |
| `ix_movies_release_year`       | movies            | release_year    | Filtro por decada/ano                                 |
| `ix_movies_cached_at`          | movies            | cached_at       | Identificar filmes com cache expirado                 |
| `ix_movie_genres_genre_id`     | movie_genres      | genre_id        | Query "filmes de um genero"; sem este, full scan      |
| `ix_watchlist_user_status`     | watchlist_entries | (user_id,status)| Query "lista de watched do usuario X" (composto)      |
| `ix_watchlist_entries_user_id` | watchlist_entries | user_id         | Query "toda watchlist do usuario X"                   |
| `ix_watchlist_entries_movie_id`| watchlist_entries | movie_id        | Query "quem tem este filme na lista"                  |
| `ix_reviews_movie_id`          | reviews           | movie_id        | Reviews de um filme especifico                        |
| `ix_reviews_user_id`           | reviews           | user_id         | Reviews de um usuario especifico                      |
| `ix_reviews_created_at`        | reviews           | created_at      | Reviews mais recentes; paginacao cronologica          |

**Implementacao:** Migracao `a1b2c3d4e5f6`, funcao `upgrade()`, BLOCO 7 (`op.create_index`)

---

## Arquivos Modificados / Criados

| Arquivo                                                                         | Tipo         |
|---------------------------------------------------------------------------------|--------------|
| `backend/app/models.py`                                                         | Atualizado   |
| `backend/alembic/versions/a1b2c3d4e5f6_consolidate_constraints_indexes_triggers_views.py` | Criado |
| `backend/docs/mer.md`                                                           | Criado       |
| `backend/docs/db_requisitos.md`                                                 | Criado       |

---

## Como Verificar no Banco

```sql
-- Listar todas as constraints
SELECT conname, contype, conrelid::regclass AS tabela,
       pg_get_constraintdef(oid) AS definicao
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, contype, conname;

-- Listar todos os indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname='public'
ORDER BY tablename, indexname;

-- Listar triggers
SELECT tgname, tgrelid::regclass AS tabela, tgenabled
FROM pg_trigger WHERE tgisinternal=false
ORDER BY tgrelid::regclass::text, tgname;

-- Listar views
SELECT viewname, definition FROM pg_views WHERE schemaname='public';

-- Testar a view de estatisticas
SELECT * FROM v_user_watchlist_stats;

-- Testar trigger de avg_rating (inserir uma review e verificar o campo movies.avg_user_rating)
-- INSERT INTO reviews (...) VALUES (...);
-- SELECT avg_user_rating FROM movies WHERE id = <movie_id>;
```
