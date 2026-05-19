import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, Heart, ListPlus, Check } from 'lucide-react';
import { useThemeStore } from '../store/themeStore'; 
import { useListStore } from '../store/listStore'; 

interface Genre {
  id: number;
  name: string;
}

interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_year: number | null;
  tmdb_rating: number | null;
  genres: Genre[];
}

// Adicionei string | number para evitar erros com o state das páginas.
interface MovieModalProps {
  movieId: number | string | null;
  onClose: () => void;
}

export function MovieModal({
  movieId,
  onClose,
}: MovieModalProps) {
  const { isDark } = useThemeStore();
  const { addToList, removeFromList, isInList } = useListStore();
  
  const [showModal, setShowModal] = useState(false);

  // Garante que o ID sempre seja tratado como número para o Zustand
  const numericId = typeof movieId === 'string' ? parseInt(movieId, 10) : movieId;

  // O modal verifica sozinho se o filme já está nas listas
  const isFavorite = numericId ? isInList('favorites', numericId) : false;
  const isInWatchlist = numericId ? isInList('watchlist', numericId) : false;
  const isWatched = numericId ? isInList('watched', numericId) : false;

  useEffect(() => {
    setShowModal(movieId !== null);
  }, [movieId]);

  // Fetch movie details
  const { data: movie, isLoading } = useQuery({
    queryKey: ['movieDetail', movieId],
    queryFn: async () => {
      if (!movieId) return null;
      const res = await fetch(`http://localhost:8000/movies/${movieId}`);
      return res.json() as Promise<MovieDetails>;
    },
    enabled: movieId !== null,
  });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (showModal) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showModal]);

  const handleClose = () => {
    setShowModal(false);
    onClose();
  };

  // Função única para alternar o status do filme (adicionar/remover)
  const handleToggleList = (listType: 'favorites' | 'watchlist' | 'watched') => {
    if (!movie) return;
    
    if (isInList(listType, movie.id)) {
      removeFromList(listType, movie.id);
    } else {
      addToList(listType, movie);
    }
  };

  if (!showModal) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`relative w-full max-w-2xl overflow-hidden rounded-lg shadow-2xl transition-all duration-300 ${
            isDark ? 'bg-neutral-900' : 'bg-white'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="flex min-h-[500px] items-center justify-center">
              <Loader2 className={`animate-spin ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} size={40} />
            </div>
          )}

          {/* Content */}
          {!isLoading && movie && (
            <>
              {/* Close Button */}
              <button
                onClick={handleClose}
                className={`absolute right-4 top-4 z-10 p-2 rounded-full transition-colors ${
                  isDark
                    ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                    : 'bg-white/80 text-neutral-700 hover:bg-white hover:text-neutral-900'
                }`}
              >
                <X size={24} />
              </button>

              {/* Poster and Backdrop */}
              <div className="relative h-64 overflow-hidden bg-black sm:h-80">
                {movie.backdrop_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className={`h-full w-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                )}

                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${
                    isDark
                      ? 'from-transparent via-neutral-900/50 to-neutral-900'
                      : 'from-transparent via-white/50 to-white'
                  }`}
                />
              </div>

              {/* Content */}
              <div className={`p-6 sm:p-8 ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
                {/* VHS Tape Bar */}
                <div className="mb-6 flex h-1 gap-2">
                  <div className="flex-1 bg-red-600"></div>
                  <div className={`flex-1 ${isDark ? 'bg-neutral-800' : 'bg-neutral-300'}`}></div>
                </div>

                {/* Title and Year */}
                <div className="mb-4">
                  <h2 className={`text-3xl font-bold leading-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {movie.title}
                  </h2>
                  <div className="mt-2 flex items-center gap-4">
                    {movie.release_year && (
                      <span className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {movie.release_year}
                      </span>
                    )}
                    {movie.tmdb_rating && (
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          ★ {movie.tmdb_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          isDark
                            ? 'bg-neutral-800 text-neutral-300'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                {movie.overview && (
                  <div className="mb-6">
                    <h3 className={`mb-2 text-sm font-semibold uppercase tracking-wider ${
                      isDark ? 'text-neutral-300' : 'text-neutral-700'
                    }`}>
                      Sinopse
                    </h3>
                    <p className={`leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {movie.overview}
                    </p>
                  </div>
                )}

                {/* Action Buttons - VHS Style - AGORA CONECTADOS AO ZUSTAND */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => handleToggleList('favorites')}
                    className={`flex items-center justify-center gap-2 rounded px-4 py-2 font-medium transition-all ${
                      isFavorite
                        ? isDark
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                        : isDark
                          ? 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                          : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? 'Favoritado' : 'Favoritar'}
                  </button>

                  <button
                    onClick={() => handleToggleList('watchlist')}
                    className={`flex items-center justify-center gap-2 rounded px-4 py-2 font-medium transition-all ${
                      isInWatchlist
                        ? isDark
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : isDark
                          ? 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                          : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <ListPlus size={18} />
                    {isInWatchlist ? 'Na Watchlist' : 'Desejo Assistir'}
                  </button>

                  <button
                    onClick={() => handleToggleList('watched')}
                    className={`flex items-center justify-center gap-2 rounded px-4 py-2 font-medium transition-all ${
                      isWatched
                        ? isDark
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                        : isDark
                          ? 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                          : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Check size={18} />
                    {isWatched ? 'Assistido' : 'Marcar Assistido'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}