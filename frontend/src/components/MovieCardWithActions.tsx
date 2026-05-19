import { useState } from 'react';
import { MovieCard } from './MovieCard';
import { Heart, Bookmark, Check, ChevronDown } from 'lucide-react';

interface MovieCardWithActionsProps {
  id: string;
  title: string;
  imageUrl: string;
  rating?: string;
  isDark?: boolean;
  movieData: {
    id: number;
    title: string;
    poster_path: string | null;
    tmdb_rating: number | null;
  };
  onAddToFavorites: (movie: any) => void;
  onAddToWatchlist: (movie: any) => void;
  onMarkAsWatched: (movie: any) => void;
  isFavorite: boolean;
  isInWatchlist: boolean;
  isWatched: boolean;
}

export function MovieCardWithActions({
  id,
  title,
  imageUrl,
  rating,
  isDark = false,
  movieData,
  onAddToFavorites,
  onAddToWatchlist,
  onMarkAsWatched,
  isFavorite,
  isInWatchlist,
  isWatched,
}: MovieCardWithActionsProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="group relative">
      <MovieCard
        title={title}
        imageUrl={imageUrl}
        rating={rating}
        id={id}
        isDark={isDark}
      />

      {/* Action Buttons Overlay */}
      <div
        className={`absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
          isDark ? 'bg-black/60' : 'bg-black/40'
        }`}
      >
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <button
            onClick={() => onAddToFavorites(movieData)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-all ${
              isFavorite
                ? 'bg-red-600 text-white'
                : isDark
                ? 'bg-white/20 text-white hover:bg-white/40'
                : 'bg-white/30 text-white hover:bg-white/50'
            }`}
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? 'Favoritado' : 'Favorito'}
          </button>

          <button
            onClick={() => onAddToWatchlist(movieData)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-all ${
              isInWatchlist
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'bg-white/20 text-white hover:bg-white/40'
                : 'bg-white/30 text-white hover:bg-white/50'
            }`}
          >
            <Bookmark size={18} fill={isInWatchlist ? 'currentColor' : 'none'} />
            {isInWatchlist ? 'Na Lista' : 'Desejo Assistir'}
          </button>

          <button
            onClick={() => onMarkAsWatched(movieData)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-all ${
              isWatched
                ? 'bg-green-600 text-white'
                : isDark
                ? 'bg-white/20 text-white hover:bg-white/40'
                : 'bg-white/30 text-white hover:bg-white/50'
            }`}
          >
            <Check size={18} />
            {isWatched ? 'Assistido' : 'Marcar Assistido'}
          </button>
        </div>
      </div>
    </div>
  );
}
