import { MovieCard } from './MovieCard';
import { Heart, Bookmark, Check } from 'lucide-react';
import type { ListMovie } from '../types/watchlist';

interface MovieCardWithActionsProps {
  movieData: ListMovie;
  isDark?: boolean;
  onAddToFavorites: (movie: ListMovie) => void;
  onAddToWatchlist: (movie: ListMovie) => void;
  onMarkAsWatched: (movie: ListMovie) => void;
  isFavorite: boolean;
  isInWatchlist: boolean;
  isWatched: boolean;
}

export function MovieCardWithActions({
  movieData,
  isDark = false,
  onAddToFavorites,
  onAddToWatchlist,
  onMarkAsWatched,
  isFavorite,
  isInWatchlist,
  isWatched,
}: MovieCardWithActionsProps) {
  return (
    <div className="group relative">
      <MovieCard
        movieId={movieData.id}
        title={movieData.title}
        imageUrl={movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : ''}
        rating={movieData.tmdb_rating?.toFixed(1)}
        isDark={isDark}
      />

      <div
        className={`absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
          isDark ? 'bg-black/60' : 'bg-black/40'
        }`}
      >
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <button
            onClick={() => onAddToFavorites(movieData)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isFavorite ? 'bg-red-600 text-white' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? 'Favoritado' : 'Favoritar'}
          </button>

          <button
            onClick={() => onAddToWatchlist(movieData)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isInWatchlist ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
          >
            <Bookmark size={16} fill={isInWatchlist ? 'currentColor' : 'none'} />
            {isInWatchlist ? 'Na Lista' : 'Desejo Assistir'}
          </button>

          <button
            onClick={() => onMarkAsWatched(movieData)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isWatched ? 'bg-green-600 text-white' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
          >
            <Check size={16} />
            {isWatched ? 'Assistido' : 'Marcar Assistido'}
          </button>
        </div>
      </div>
    </div>
  );
}
