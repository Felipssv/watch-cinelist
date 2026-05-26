/**
 * Tipos do dominio de reviews.
 *
 * `rating` esta na escala 1-5 em todo o app: backend, service, hooks e o
 * componente StarRating (usado com `max={5}`). Nao ha normalizacao.
 */

/** Resumo do filme embutido na review pelo backend. */
export interface ReviewMovieSummary {
  id: number;
  title: string;
  poster_path: string | null;
  release_year: number | null;
}

/** Autor da review (versao publica reduzida). */
export interface ReviewUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

/**
 * Review retornada pelo backend.
 *
 * `rating` esta na escala 1-5. Pode ser `null` quando a review nao tem nota.
 */
export interface Review {
  id: string;
  user_id: string;
  movie_id: number;
  content: string;
  rating: number | null;
  title: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user: ReviewUser;
  movie: ReviewMovieSummary;
}

/** Listagem paginada de reviews retornada pelo backend. */
export interface ReviewListResponse {
  results: Review[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Dados de entrada para criar/atualizar uma review na UI.
 *
 * `rating` aqui esta na escala 1-5 (enviado direto ao backend).
 */
export interface ReviewInput {
  content: string;
  rating?: number | null;
  title?: string | null;
  is_public?: boolean;
}
