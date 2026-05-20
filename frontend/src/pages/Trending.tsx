import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';
import { TrendingUp, Loader2, AlertCircle, Flame, Star, Clapperboard } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useMoviesByCategory } from '../hooks/useMovies';
import type { FilterType } from '../types/movie';

const TABS: { key: FilterType; label: string; icon: typeof Flame }[] = [
  { key: 'popular', label: 'Em Alta', icon: Flame },
  { key: 'top_rated', label: 'Melhor Avaliados', icon: Star },
  { key: 'now_playing', label: 'Nos Cinemas', icon: Clapperboard },
];

export default function Trending() {
  const { isDark } = useThemeStore();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<FilterType>(
    (location.state?.filter as FilterType) || 'popular'
  );
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error } =
    useMoviesByCategory(activeTab);

  const allMovies = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? 'bg-neutral-950 selection:bg-red-900 selection:text-white'
          : 'bg-white selection:bg-red-100 selection:text-red-900'
      }`}
    >
      <Header currentPage="trending" />

      <main className="pt-20">
        <div
          className={`border-b py-12 ${
            isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'
          }`}
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10">
                <TrendingUp size={20} className="text-red-500" />
              </div>
              <h1
                className={`text-4xl font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                Filmes em Alta
              </h1>
            </div>
            <p className={`text-base ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Descubra o que esta em alta, os mais bem avaliados e o que esta em cartaz.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
          <div
            className={`flex flex-wrap gap-2 border-b ${
              isDark ? 'border-neutral-800' : 'border-neutral-200'
            }`}
          >
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? isDark
                      ? 'border-b-2 border-red-600 text-white'
                      : 'border-b-2 border-red-600 text-neutral-900'
                    : isDark
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-16">
          {status === 'error' ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle size={48} className="mb-4 text-red-500 opacity-70" />
              <h3
                className={`mb-2 text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
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
          ) : (
            <>
              {allMovies.length > 0 && (
                <p
                  className={`mb-6 mt-4 text-sm font-medium ${
                    isDark ? 'text-neutral-500' : 'text-neutral-500'
                  }`}
                >
                  {allMovies.length} filme{allMovies.length !== 1 ? 's' : ''} carregado
                  {allMovies.length !== 1 ? 's' : ''}
                </p>
              )}

              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {allMovies.map((movie, index) => (
                  <div key={`${movie.id}-${index}`} className="flex justify-center">
                    <MovieCard
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
                  </div>
                ))}
              </div>

              <div className="mt-12 flex justify-center">
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
