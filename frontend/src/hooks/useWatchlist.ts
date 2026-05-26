import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createWatchlistEntry,
  deleteWatchlistEntry,
  fetchWatchlist,
  updateWatchlistEntry,
} from '../services/watchlist';
import { useAuthStore } from '../store/authStore';
import type {
  ListMovie,
  WatchlistCreateInput,
  WatchlistEntry,
  WatchlistUpdateInput,
} from '../types/watchlist';

export const watchlistKeys = {
  all: ['watchlist'] as const,
};

/** Tipos de "lista" da UI, projetados sobre a unica entrada por filme. */
export type ListType = 'favorites' | 'watchlist' | 'watched';

/**
 * Todas as entradas de watchlist do usuario logado. Fonte unica de verdade
 * para favoritos / watchlist / assistidos.
 */
export function useWatchlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: watchlistKeys.all,
    queryFn: () => fetchWatchlist({ limit: 500 }),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
}

function useInvalidateWatchlist() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
}

export function useAddToWatchlist() {
  const invalidate = useInvalidateWatchlist();
  return useMutation({
    mutationFn: (input: WatchlistCreateInput) => createWatchlistEntry(input),
    onSuccess: invalidate,
  });
}

export function useUpdateWatchlist() {
  const invalidate = useInvalidateWatchlist();
  return useMutation({
    mutationFn: ({
      movieId,
      input,
    }: {
      movieId: number;
      input: WatchlistUpdateInput;
    }) => updateWatchlistEntry(movieId, input),
    onSuccess: invalidate,
  });
}

export function useRemoveFromWatchlist() {
  const invalidate = useInvalidateWatchlist();
  return useMutation({
    mutationFn: (movieId: number) => deleteWatchlistEntry(movieId),
    onSuccess: invalidate,
  });
}

/** Mapeia uma entrada do backend para o shape leve usado pelos cards. */
function toListMovie(entry: WatchlistEntry): ListMovie {
  return {
    id: entry.movie.id,
    title: entry.movie.title,
    poster_path: entry.movie.poster_path,
    tmdb_rating: entry.movie.tmdb_rating,
  };
}

/**
 * Decide se uma entrada continua "util" depois de uma alteracao. Quando deixa
 * de pertencer a qualquer lista (nao e favorito, status volta a um estado
 * neutro), a entrada inteira e removida para nao acumular lixo no backend.
 */
function isEntryEmpty(
  isFavorite: boolean,
  isInWatchlist: boolean,
  isWatched: boolean
): boolean {
  return !isFavorite && !isInWatchlist && !isWatched;
}

export interface MovieLists {
  favorites: ListMovie[];
  watchlist: ListMovie[];
  watched: ListMovie[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  isInList: (listType: ListType, movieId: number) => boolean;
  /**
   * Alterna a presenca de um filme em uma das listas, resolvendo o
   * POST/PATCH/DELETE correto dado que existe uma unica entrada por filme.
   */
  toggleList: (listType: ListType, movie: ListMovie) => void;
  /** Remove o filme de uma lista especifica (usado pelo botao de lixeira). */
  removeFromList: (listType: ListType, movieId: number) => void;
  /** Indica se ha alguma mutacao em andamento. */
  isMutating: boolean;
}

/**
 * Hook de alto nivel que da aos componentes a mesma ergonomia do antigo
 * listStore (favorites/watchlist/watched/isInList/toggle), porem com o backend
 * como fonte de verdade. As mutacoes invalidam ['watchlist'].
 */
export function useMovieLists(): MovieLists {
  const { data: entries = [], isLoading, isError, refetch } = useWatchlist();
  const addMutation = useAddToWatchlist();
  const updateMutation = useUpdateWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  const entryByMovie = useMemo(() => {
    const map = new Map<number, WatchlistEntry>();
    for (const entry of entries) map.set(entry.movie_id, entry);
    return map;
  }, [entries]);

  const favorites = useMemo(
    () => entries.filter((e) => e.is_favorite).map(toListMovie),
    [entries]
  );
  const watchlist = useMemo(
    () =>
      entries
        .filter((e) => e.status === 'want_to_watch')
        .map(toListMovie),
    [entries]
  );
  const watched = useMemo(
    () => entries.filter((e) => e.status === 'watched').map(toListMovie),
    [entries]
  );

  const isInList = (listType: ListType, movieId: number): boolean => {
    const entry = entryByMovie.get(movieId);
    if (!entry) return false;
    if (listType === 'favorites') return entry.is_favorite;
    if (listType === 'watchlist') return entry.status === 'want_to_watch';
    return entry.status === 'watched';
  };

  /** Estado projetado da entrada apos aplicar a alteracao pedida. */
  const projectAfterToggle = (
    entry: WatchlistEntry | undefined,
    listType: ListType
  ): { is_favorite: boolean; isInWatchlist: boolean; isWatched: boolean } => {
    const curFav = entry?.is_favorite ?? false;
    const curWatchlist = entry?.status === 'want_to_watch';
    const curWatched = entry?.status === 'watched';

    if (listType === 'favorites') {
      return {
        is_favorite: !curFav,
        isInWatchlist: curWatchlist,
        isWatched: curWatched,
      };
    }
    if (listType === 'watchlist') {
      // Ligar watchlist desliga watched (status e mutuamente exclusivo).
      return {
        is_favorite: curFav,
        isInWatchlist: !curWatchlist,
        isWatched: false,
      };
    }
    // watched
    return {
      is_favorite: curFav,
      isInWatchlist: false,
      isWatched: !curWatched,
    };
  };

  const toggleList = (listType: ListType, movie: ListMovie) => {
    const entry = entryByMovie.get(movie.id);
    const next = projectAfterToggle(entry, listType);

    if (!entry) {
      // Sem entrada ainda → cria com o estado desejado.
      addMutation.mutate({
        movie_id: movie.id,
        is_favorite: next.is_favorite,
        status: next.isWatched
          ? 'watched'
          : next.isInWatchlist
            ? 'want_to_watch'
            : 'dropped',
      });
      return;
    }

    if (isEntryEmpty(next.is_favorite, next.isInWatchlist, next.isWatched)) {
      // Entrada deixou de pertencer a qualquer lista → remove por completo.
      removeMutation.mutate(movie.id);
      return;
    }

    const input: WatchlistUpdateInput = { is_favorite: next.is_favorite };
    if (listType !== 'favorites') {
      input.status = next.isWatched
        ? 'watched'
        : next.isInWatchlist
          ? 'want_to_watch'
          : 'dropped';
    }
    updateMutation.mutate({ movieId: movie.id, input });
  };

  const removeFromList = (listType: ListType, movieId: number) => {
    const entry = entryByMovie.get(movieId);
    if (!entry) return;

    if (listType === 'favorites') {
      const stillUseful = entry.status === 'want_to_watch' || entry.status === 'watched';
      if (stillUseful) {
        updateMutation.mutate({ movieId, input: { is_favorite: false } });
      } else {
        removeMutation.mutate(movieId);
      }
      return;
    }

    // watchlist / watched: limpar o status. Se ainda for favorito, mantem a
    // entrada com status neutro; caso contrario remove de vez.
    if (entry.is_favorite) {
      updateMutation.mutate({ movieId, input: { status: 'dropped' } });
    } else {
      removeMutation.mutate(movieId);
    }
  };

  return {
    favorites,
    watchlist,
    watched,
    isLoading,
    isError,
    refetch,
    isInList,
    toggleList,
    removeFromList,
    isMutating:
      addMutation.isPending ||
      updateMutation.isPending ||
      removeMutation.isPending,
  };
}
