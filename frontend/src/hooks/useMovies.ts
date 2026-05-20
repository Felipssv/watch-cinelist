import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchMovies,
  fetchMovieById,
  searchMovies,
  fetchMoviesByCategory,
} from '../services/movies';
import type { FilterType } from '../types/movie';

export const movieKeys = {
  all: ['movies'] as const,
  lists: () => [...movieKeys.all, 'list'] as const,
  list: (filter: FilterType) => [...movieKeys.lists(), filter] as const,
  search: (query: string) => [...movieKeys.all, 'search', query] as const,
  detail: (id: number) => [...movieKeys.all, 'detail', id] as const,
  featured: () => [...movieKeys.all, 'featured'] as const,
};

export function useMovies() {
  return useQuery({
    queryKey: movieKeys.featured(),
    queryFn: fetchMovies,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMovieDetail(id: number | string | null) {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  return useQuery({
    queryKey: movieKeys.detail(numericId ?? 0),
    queryFn: () => fetchMovieById(numericId!),
    enabled: numericId !== null && !isNaN(numericId ?? NaN),
    staleTime: 10 * 60 * 1000,
  });
}

export function useMovieSearch(query: string) {
  return useInfiniteQuery({
    queryKey: movieKeys.search(query),
    queryFn: ({ pageParam = 1 }) => searchMovies(query, pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: query.trim().length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMoviesByCategory(category: FilterType) {
  return useInfiniteQuery({
    queryKey: movieKeys.list(category),
    queryFn: ({ pageParam = 1 }) =>
      fetchMoviesByCategory(category, pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}
