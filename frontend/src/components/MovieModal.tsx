import { useEffect, useState } from 'react';
import { X, Loader2, Heart, ListPlus, Check, PenLine, Star } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useListStore } from '../store/listStore';
import { useReviewStore } from '../store/reviewStore';
import { useMovieDetail } from '../hooks/useMovies';
import { ReviewModal } from './ReviewModal';

interface MovieModalProps {
  movieId: number | string | null;
  onClose: () => void;
}

export function MovieModal({ movieId, onClose }: MovieModalProps) {
  const { isDark } = useThemeStore();
  const { addToList, removeFromList, isInList } = useListStore();
  const { getReview, hasReview } = useReviewStore();

  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const numericId = typeof movieId === 'string' ? parseInt(movieId, 10) : movieId;

  const isFavorite = numericId ? isInList('favorites', numericId) : false;
  const isInWatchlist = numericId ? isInList('watchlist', numericId) : false;
  const isWatched = numericId ? isInList('watched', numericId) : false;
  const reviewExists = numericId ? hasReview(numericId) : false;
  const review = numericId ? getReview(numericId) : undefined;

  const { data: movie, isLoading } = useMovieDetail(movieId);

  useEffect(() => {
    setShowModal(movieId !== null);
  }, [movieId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showReviewModal) handleClose();
    };
    if (showModal) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showModal, showReviewModal]);

  const handleClose = () => {
    setShowModal(false);
    onClose();
  };

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
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div
          className={`relative w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl transition-all ${
            isDark ? 'bg-neutral-900' : 'bg-white'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading && (
            <div className="flex min-h-[500px] items-center justify-center">
              <Loader2
                className={`animate-spin ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
                size={40}
              />
            </div>
          )}

          {!isLoading && movie && (
            <>
              <button
                onClick={handleClose}
                className={`absolute right-4 top-4 z-10 rounded-full p-2 transition-colors ${
                  isDark
                    ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                    : 'bg-white/80 text-neutral-700 hover:bg-white hover:text-neutral-900'
                }`}
              >
                <X size={22} />
              </button>

              <div className="relative h-64 overflow-hidden bg-black sm:h-72">
                {movie.backdrop_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className={`h-full w-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                )}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${
                    isDark
                      ? 'from-transparent via-neutral-900/40 to-neutral-900'
                      : 'from-transparent via-white/40 to-white'
                  }`}
                />
              </div>

              <div className={`max-h-[60vh] overflow-y-auto p-6 sm:p-8 ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
                <div className="mb-5 flex h-1 gap-2">
                  <div className="flex-1 bg-red-600" />
                  <div className={`flex-1 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                </div>

                <div className="mb-4">
                  <h2 className={`text-2xl font-bold leading-tight sm:text-3xl ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {movie.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {movie.release_year && (
                      <span className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {movie.release_year}
                      </span>
                    )}
                    {movie.tmdb_rating && (
                      <div className="flex items-center gap-1">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {movie.tmdb_rating.toFixed(1)}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>/10</span>
                      </div>
                    )}
                    {reviewExists && review && (
                      <div className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5">
                        <PenLine size={11} className="text-red-400" />
                        <span className="text-xs font-medium text-red-400">
                          Sua nota: {review.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {movie.genres && movie.genres.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          isDark
                            ? 'bg-neutral-800 text-neutral-300'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {movie.overview && (
                  <div className="mb-6">
                    <h3 className={`mb-2 text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Sinopse
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {movie.overview}
                    </p>
                  </div>
                )}

                {reviewExists && review?.text && (
                  <div className={`mb-6 rounded-lg border-l-2 border-red-500 pl-4 ${isDark ? 'bg-neutral-800/50' : 'bg-red-50/50'} py-3 pr-4`}>
                    <p className={`mb-1 text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Sua review
                    </p>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {review.text}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    onClick={() => handleToggleList('favorites')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isFavorite
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : isDark
                          ? 'border border-neutral-700 text-neutral-300 hover:border-red-600/50 hover:bg-neutral-800'
                          : 'border border-neutral-200 text-neutral-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? 'Favoritado' : 'Favoritar'}
                  </button>

                  <button
                    onClick={() => handleToggleList('watchlist')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isInWatchlist
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : isDark
                          ? 'border border-neutral-700 text-neutral-300 hover:border-blue-600/50 hover:bg-neutral-800'
                          : 'border border-neutral-200 text-neutral-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <ListPlus size={16} />
                    {isInWatchlist ? 'Na Lista' : 'Watchlist'}
                  </button>

                  <button
                    onClick={() => handleToggleList('watched')}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isWatched
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : isDark
                          ? 'border border-neutral-700 text-neutral-300 hover:border-green-600/50 hover:bg-neutral-800'
                          : 'border border-neutral-200 text-neutral-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <Check size={16} />
                    {isWatched ? 'Assistido' : 'Marcar'}
                  </button>

                  <button
                    onClick={() => setShowReviewModal(true)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      reviewExists
                        ? isDark
                          ? 'border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'border border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                        : isDark
                          ? 'border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800'
                          : 'border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <PenLine size={16} />
                    {reviewExists ? 'Ver review' : 'Escrever'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showReviewModal && movie && (
        <ReviewModal
          movieId={movie.id}
          movieTitle={movie.title}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </>
  );
}
