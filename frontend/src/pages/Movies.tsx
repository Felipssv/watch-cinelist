import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useMovieSearch, useMoviesByCategory } from '../hooks/useMovies';
import type { FilterType } from '../types/movie';

const FILTER_LABELS: Record<FilterType, string> = {
  popular: 'Em Alta',
  now_playing: 'Lancamentos',
  top_rated: 'Melhor Avaliados',
};

export default function Movies() {
  const { isDark } = useThemeStore();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (location.state?.filter as FilterType) || 'popular'
  );
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = debouncedQuery.trim().length > 0;

  const searchResult = useMovieSearch(debouncedQuery);
  const categoryResult = useMoviesByCategory(activeFilter);

  const active = isSearching ? searchResult : categoryResult;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = active;

  const allMovies = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? 'bg-neutral-950 selection:bg-red-900 selection:text-white'
          : 'bg-white selection:bg-red-100 selection:text-red-900'
      }`}
    >
      <Header currentPage="movies" />

      <main className="pt-20">
        <div
          className={`border-b py-12 ${
            isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'
          }`}
        >
          <div className="mx-auto max-w-7xl px-6">
            <h1
              className={`mb-2 text-4xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
            >
              Todos os Filmes
            </h1>
            <p className={`text-base ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {isSearching ? `Resultados para "${debouncedQuery}"` : 'Navegue por nossa colecao completa'}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
          <div className="relative mb-6">
            <Search
              size={18}
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            />
            <input
              type="text"
              placeholder="Procure por um filme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl border px-11 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 ${
                isDark
                  ? 'border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500'
                  : 'border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400'
              }`}
            />
          </div>

          {!isSearching && (
            <div
              className={`flex flex-wrap gap-1 border-b ${
                isDark ? 'border-neutral-800' : 'border-neutral-200'
              }`}
            >
              {(Object.keys(FILTER_LABELS) as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? isDark
                        ? 'border-b-2 border-red-600 text-white'
                        : 'border-b-2 border-red-600 text-neutral-900'
                      : isDark
                        ? 'text-neutral-400 hover:text-white'
                        : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {FILTER_LABELS[filter]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-16">
          {status === 'error' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle size={48} className="mb-4 text-red-500 opacity-70" />
              <h3 className={`mb-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Erro ao carregar filmes
              </h3>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {(error as Error)?.message ?? 'Tente novamente mais tarde.'}
              </p>
            </div>
          ) : status === 'pending' ? (
            <div className="flex items-center justify-center py-20">
              <Loader2
                className={`animate-spin ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
                size={40}
              />
            </div>
          ) : allMovies.length > 0 ? (
            <>
              <p className={`mb-6 mt-2 text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                {allMovies.length} filme{allMovies.length !== 1 ? 's' : ''} carregado{allMovies.length !== 1 ? 's' : ''}
              </p>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allMovies.map((movie, index) => (
                  <MovieCard
                    key={`${movie.id}-${index}`}
                    movieId={movie.id}
                    title={movie.title}
                    rating={movie.tmdb_rating?.toFixed(1)}
                    imageUrl={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : ''
                    }
                    isDark={isDark}
                    onClick={() => setSelectedMovieId(movie.id)}
                  />
                ))}
              </div>

              <div ref={loadMoreRef} className="mt-12 flex justify-center">
                {hasNextPage && (
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      'Carregar Mais'
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div
              className={`flex flex-col items-center justify-center py-20 text-center ${
                isDark ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              <Search size={48} className="mb-4 opacity-30" />
              <h3 className="mb-2 text-xl font-semibold">
                {isSearching ? 'Nenhum filme encontrado' : 'Nenhum filme disponivel'}
              </h3>
              <p className="text-sm">
                {isSearching
                  ? 'Tente procurar por outro titulo'
                  : 'Nenhum resultado para esta categoria.'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {selectedMovieId !== null && (
        <MovieModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
    </div>
  );
}
