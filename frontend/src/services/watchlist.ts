import api from './api';
import type {
  WatchlistCreateInput,
  WatchlistEntry,
  WatchlistQuery,
  WatchlistUpdateInput,
} from '../types/watchlist';

/**
 * Camada de acesso aos endpoints de watchlist do backend.
 * Usa a instancia `api` compartilhada (interceptor de JWT em ./api).
 */

export async function createWatchlistEntry(
  input: WatchlistCreateInput
): Promise<WatchlistEntry> {
  const { data } = await api.post<WatchlistEntry>('/watchlist', input);
  return data;
}

interface WatchlistListResponse {
  results: WatchlistEntry[];
  total: number;
  skip: number;
  limit: number;
}

export async function fetchWatchlist(
  query: WatchlistQuery = {}
): Promise<WatchlistEntry[]> {
  const { data } = await api.get<WatchlistListResponse>('/watchlist', {
    params: query,
  });
  return data.results;
}

export async function fetchWatchlistEntry(
  movieId: number
): Promise<WatchlistEntry> {
  const { data } = await api.get<WatchlistEntry>(`/watchlist/${movieId}`);
  return data;
}

export async function updateWatchlistEntry(
  movieId: number,
  input: WatchlistUpdateInput
): Promise<WatchlistEntry> {
  const { data } = await api.patch<WatchlistEntry>(
    `/watchlist/${movieId}`,
    input
  );
  return data;
}

export async function deleteWatchlistEntry(movieId: number): Promise<void> {
  await api.delete(`/watchlist/${movieId}`);
}
