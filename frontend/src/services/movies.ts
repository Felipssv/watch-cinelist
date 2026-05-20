import api from './api';
import type { Movie, MovieSearchResponse, FilterType } from '../types/movie';

export async function fetchMovies(): Promise<Movie[]> {
  const { data } = await api.get<Movie[]>('/movies');
  return data;
}

export async function fetchMovieById(id: number): Promise<Movie> {
  const { data } = await api.get<Movie>(`/movies/${id}`);
  return data;
}

export async function searchMovies(
  query: string,
  page: number = 1
): Promise<MovieSearchResponse> {
  const { data } = await api.get<MovieSearchResponse>('/movies/search', {
    params: { q: query, page },
  });
  return data;
}

export async function fetchMoviesByCategory(
  category: FilterType,
  page: number = 1
): Promise<MovieSearchResponse> {
  const { data } = await api.get<MovieSearchResponse>('/movies/search', {
    params: { category, page },
  });
  return data;
}
