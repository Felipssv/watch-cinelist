/**
 * Tipos do dominio de watchlist/favoritos/assistidos.
 *
 * O backend mantem UMA entrada por filme. As tres "listas" da UI sao apenas
 * projecoes da mesma entrada:
 *   - favorites = entradas com `is_favorite === true`
 *   - watchlist = entradas com `status === 'want_to_watch'`
 *   - watched   = entradas com `status === 'watched'`
 *
 * Por isso favoritar um filme que ja esta na watchlist deve atualizar (PATCH)
 * a entrada existente, e nao criar uma nova.
 */

export type WatchStatus = 'want_to_watch' | 'watching' | 'watched' | 'dropped';

/** Resumo do filme embutido na entrada de watchlist pelo backend. */
export interface WatchlistMovieSummary {
  id: number;
  title: string;
  poster_path: string | null;
  tmdb_rating: number | null;
}

/** Entrada de watchlist retornada pelo backend. */
export interface WatchlistEntry {
  id: string;
  user_id: string;
  movie_id: number;
  status: WatchStatus;
  is_favorite: boolean;
  rating: number | null;
  review: string | null;
  notes: string | null;
  watched_at: string | null;
  created_at: string;
  updated_at: string;
  movie: WatchlistMovieSummary;
}

/** Corpo de criacao (POST /watchlist). */
export interface WatchlistCreateInput {
  movie_id: number;
  status?: WatchStatus;
  is_favorite?: boolean;
  rating?: number | null;
  review?: string | null;
  notes?: string | null;
}

/** Corpo de atualizacao (PATCH /watchlist/{movie_id}) — todos opcionais. */
export interface WatchlistUpdateInput {
  status?: WatchStatus;
  is_favorite?: boolean;
  rating?: number | null;
  review?: string | null;
  notes?: string | null;
}

/** Filtros aceitos por GET /watchlist. */
export interface WatchlistQuery {
  status?: WatchStatus;
  is_favorite?: boolean;
  skip?: number;
  limit?: number;
}

/**
 * Forma minima de filme aceita pelos botoes de acao (favoritar / watchlist /
 * assistido). Compativel com `Movie` e com os resumos embutidos nas reviews.
 *
 * Substitui o antigo `ListMovie` do listStore (removido na migracao para a API).
 */
export interface ListMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  tmdb_rating?: number | null;
}
