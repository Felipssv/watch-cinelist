export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  original_title?: string | null;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  release_year?: number | null;
  tmdb_rating?: number | null;
  genres?: Genre[];
}

export interface MovieSearchResult {
  id: number;
  title: string;
  original_title?: string | null;
  poster_path: string | null;
  overview?: string | null;
  release_year?: number | null;
  tmdb_rating?: number | null;
}

export interface MovieSearchResponse {
  results: MovieSearchResult[];
  page: number;
  total_pages: number;
}

export type FilterType = 'popular' | 'now_playing' | 'top_rated';

export type ListType = 'favorites' | 'watchlist' | 'watched';
