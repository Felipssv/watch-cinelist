import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';
import { ReviewModal } from '../components/ReviewModal';
import { StarRating } from '../components/StarRating';
import { Search, Trash2, PenLine, Calendar } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useListStore } from '../store/listStore';
import type { ListMovie } from '../store/listStore';
import { useReviewStore } from '../store/reviewStore';
import type { Review } from '../store/reviewStore';

type ListTab = 'favorites' | 'watchlist' | 'watched' | 'reviews';

const TAB_LABELS: Record<ListTab, string> = {
  favorites: 'Favoritos',
  watchlist: 'Desejo Assistir',
  watched: 'Ja Assistidos',
  reviews: 'Minhas Reviews',
};

export default function MyList() {
  const { isDark } = useThemeStore();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<ListTab>(
    (location.state?.tab as ListTab) || 'favorites'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ id: number; title: string } | null>(null);

  const { favorites, watchlist, watched, removeFromList } = useListStore();
  const { reviews, removeReview } = useReviewStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const getListMovies = () => {
    const lists = { favorites, watchlist, watched };
    if (activeTab === 'reviews') return [];
    return lists[activeTab] || [];
  };

  const filteredMovies = getListMovies().filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviews.filter((r) =>
    r.movieTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTabCount = (tab: ListTab) => {
    if (tab === 'favorites') return favorites.length;
    if (tab === 'watchlist') return watchlist.length;
    if (tab === 'watched') return watched.length;
    if (tab === 'reviews') return reviews.length;
    return 0;
  };

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? 'bg-neutral-950 selection:bg-red-900 selection:text-white'
          : 'bg-white selection:bg-red-100 selection:text-red-900'
      }`}
    >
      <Header currentPage="watchlist" />

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
              Minha Lista
            </h1>
            <p className={`text-base ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Organize seus filmes e escreva suas proprias reviews
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-8">
          <div
            className={`mb-8 flex flex-wrap gap-1 border-b ${
              isDark ? 'border-neutral-800' : 'border-neutral-200'
            }`}
          >
            {(Object.keys(TAB_LABELS) as ListTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery('');
                }}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? isDark
                      ? 'border-b-2 border-red-600 text-white'
                      : 'border-b-2 border-red-600 text-neutral-900'
                    : isDark
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {TAB_LABELS[tab]}
                {getTabCount(tab) > 0 && (
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      activeTab === tab
                        ? 'bg-red-600 text-white'
                        : isDark
                          ? 'bg-neutral-700 text-neutral-300'
                          : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {getTabCount(tab)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search
                size={18}
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-neutral-500' : 'text-neutral-400'
                }`}
              />
              <input
                type="text"
                placeholder={
                  activeTab === 'reviews'
                    ? 'Procure nas suas reviews...'
                    : 'Procure nos seus filmes...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl border px-11 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 ${
                  isDark
                    ? 'border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500'
                    : 'border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400'
                }`}
              />
            </div>
          </div>

          {activeTab === 'reviews' ? (
            <ReviewsGrid
              reviews={filteredReviews}
              isDark={isDark}
              searchQuery={searchQuery}
              onEdit={(id, title) => setReviewTarget({ id, title })}
              onDelete={removeReview}
              onMovieClick={setSelectedMovieId}
            />
          ) : (
            <MoviesGrid
              movies={filteredMovies}
              isDark={isDark}
              searchQuery={searchQuery}
              listTab={activeTab}
              onRemove={(id) => removeFromList(activeTab as 'favorites' | 'watchlist' | 'watched', id)}
              onMovieClick={setSelectedMovieId}
            />
          )}
        </div>
      </main>

      <Footer />

      {selectedMovieId !== null && (
        <MovieModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}

      {reviewTarget && (
        <ReviewModal
          movieId={reviewTarget.id}
          movieTitle={reviewTarget.title}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}

interface MoviesGridProps {
  movies: ListMovie[];
  isDark: boolean;
  searchQuery: string;
  listTab: 'favorites' | 'watchlist' | 'watched';
  onRemove: (id: number) => void;
  onMovieClick: (id: number) => void;
}

function MoviesGrid({ movies, isDark, searchQuery, onRemove, onMovieClick }: MoviesGridProps) {
  if (movies.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-20 text-center ${
          isDark ? 'text-neutral-400' : 'text-neutral-600'
        }`}
      >
        <Search size={48} className="mb-4 opacity-20" />
        <h3 className="mb-2 text-xl font-semibold">
          {searchQuery ? 'Nenhum item encontrado' : 'Lista vazia'}
        </h3>
        <p className="text-sm">
          {searchQuery
            ? 'Tente procurar por outro titulo'
            : 'Comece a adicionar filmes a sua lista'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {movies.map((movie) => (
        <div key={movie.id} className="group relative">
          <MovieCard
            movieId={movie.id}
            title={movie.title}
            rating={movie.tmdb_rating?.toFixed(1)}
            imageUrl={
              movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
            }
            isDark={isDark}
            onClick={() => onMovieClick(movie.id)}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(movie.id);
            }}
            className={`absolute right-3 top-3 rounded-full p-2 opacity-0 transition-all group-hover:opacity-100 ${
              isDark
                ? 'bg-neutral-900/80 text-red-400 hover:bg-red-600 hover:text-white'
                : 'bg-white/80 text-red-500 hover:bg-red-600 hover:text-white'
            }`}
            aria-label="Remover da lista"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

interface ReviewsGridProps {
  reviews: Review[];
  isDark: boolean;
  searchQuery: string;
  onEdit: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  onMovieClick: (id: number) => void;
}

function ReviewsGrid({ reviews, isDark, searchQuery, onEdit, onDelete, onMovieClick }: ReviewsGridProps) {
  if (reviews.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-20 text-center ${
          isDark ? 'text-neutral-400' : 'text-neutral-600'
        }`}
      >
        <PenLine size={48} className="mb-4 opacity-20" />
        <h3 className="mb-2 text-xl font-semibold">
          {searchQuery ? 'Nenhuma review encontrada' : 'Nenhuma review ainda'}
        </h3>
        <p className="text-sm">
          {searchQuery
            ? 'Tente procurar por outro titulo'
            : 'Abra um filme e escreva sua primeira review'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <div
          key={review.movieId}
          className={`group relative rounded-xl border p-5 transition-shadow hover:shadow-lg ${
            isDark
              ? 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <button
              onClick={() => onMovieClick(review.movieId)}
              className={`text-left text-base font-semibold leading-tight transition-colors hover:text-red-500 ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {review.movieTitle}
            </button>
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEdit(review.movieId, review.movieTitle)}
                className={`rounded-lg p-1.5 transition-colors ${
                  isDark
                    ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
                aria-label="Editar review"
              >
                <PenLine size={15} />
              </button>
              <button
                onClick={() => onDelete(review.movieId)}
                className={`rounded-lg p-1.5 transition-colors ${
                  isDark
                    ? 'text-neutral-400 hover:bg-red-900/30 hover:text-red-400'
                    : 'text-neutral-400 hover:bg-red-50 hover:text-red-500'
                }`}
                aria-label="Excluir review"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div className="mb-3">
            <StarRating value={review.rating} max={10} size={16} readonly isDark={isDark} />
          </div>

          {review.text && (
            <p
              className={`mb-4 text-sm leading-relaxed line-clamp-3 ${
                isDark ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              {review.text}
            </p>
          )}

          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
            <Calendar size={11} />
            <span>
              {new Date(review.updatedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
