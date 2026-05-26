import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HeroSection } from '../components/HeroSection';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useMovieLists } from '../hooks/useWatchlist';
import { useMovies } from '../hooks/useMovies';

export default function Home() {
  const { isDark } = useThemeStore();
  const { isInList, toggleList, watched } = useMovieLists();
  const navigate = useNavigate();

  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  const { data: movies = [], isLoading } = useMovies();

  const featuredMovie = movies[0] ?? null;
  const trendingMovies = movies.slice(0, 10);
  const newReleases = movies.slice(10, 20);

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? 'bg-neutral-950 selection:bg-red-900 selection:text-white'
          : 'bg-white selection:bg-red-100 selection:text-red-900'
      }`}
    >
      <Header currentPage="home" />

      <main>
        {isLoading ? (
          <div className="flex h-[70vh] w-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-red-600" />
          </div>
        ) : (
          <>
            {featuredMovie && (
              <HeroSection
                title={featuredMovie.title}
                description={featuredMovie.overview ?? 'Sinopse nao disponivel.'}
                imageUrl={
                  featuredMovie.backdrop_path
                    ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`
                    : ''
                }
                tag="Em Destaque"
                genre={featuredMovie.genres?.[0]?.name ?? 'Filme'}
                rating={featuredMovie.tmdb_rating?.toFixed(1) ?? 'N/A'}
                year={featuredMovie.release_year?.toString() ?? ''}
                isDark={isDark}
                onPlayClick={() => setSelectedMovieId(featuredMovie.id)}
                isInList={isInList('watchlist', featuredMovie.id)}
                onListClick={() =>
                  toggleList('watchlist', {
                    id: featuredMovie.id,
                    title: featuredMovie.title,
                    poster_path: featuredMovie.poster_path,
                    backdrop_path: featuredMovie.backdrop_path,
                    tmdb_rating: featuredMovie.tmdb_rating,
                  })
                }
              />
            )}

            <div className="mx-auto max-w-7xl px-6 py-12">
              <section className="mb-20">
                <SectionHeader
                  title="Assistidos Recentemente"
                  subtitle="Os filmes que voce assistiu nos ultimos dias."
                  isDark={isDark}
                  onViewAll={() => navigate('/minha-lista', { state: { tab: 'watched' } })}
                />
                {watched.length > 0 ? (
                  <MovieRow
                    movies={watched.map((m) => ({
                      id: m.id,
                      title: m.title,
                      rating: m.tmdb_rating?.toFixed(1),
                      imageUrl: m.poster_path
                        ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                        : '',
                    }))}
                    isDark={isDark}
                    onSelect={setSelectedMovieId}
                  />
                ) : (
                  <EmptyRow
                    message="Voce ainda nao marcou nenhum filme como assistido."
                    isDark={isDark}
                  />
                )}
              </section>

              <section className="mb-20">
                <SectionHeader
                  title="Em Alta"
                  subtitle="Os filmes mais populares do momento."
                  isDark={isDark}
                  onViewAll={() => navigate('/trending')}
                />
                <MovieRow
                  movies={trendingMovies.map((m) => ({
                    id: m.id,
                    title: m.title,
                    rating: m.tmdb_rating?.toFixed(1),
                    imageUrl: m.poster_path
                      ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                      : '',
                  }))}
                  isDark={isDark}
                  onSelect={setSelectedMovieId}
                />
              </section>

              <section className="mb-20">
                <SectionHeader
                  title="Lancamentos"
                  subtitle="Os filmes mais recentes que chegaram."
                  isDark={isDark}
                  onViewAll={() => navigate('/filmes', { state: { filter: 'now_playing' } })}
                />
                <MovieRow
                  movies={newReleases.map((m) => ({
                    id: m.id,
                    title: m.title,
                    rating: m.tmdb_rating?.toFixed(1),
                    imageUrl: m.poster_path
                      ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                      : '',
                  }))}
                  isDark={isDark}
                  onSelect={setSelectedMovieId}
                />
              </section>
            </div>
          </>
        )}
      </main>

      <Footer />

      {selectedMovieId !== null && (
        <MovieModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  isDark: boolean;
  onViewAll: () => void;
}

function SectionHeader({ title, subtitle, isDark, onViewAll }: SectionHeaderProps) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h3
          className={`mb-1 text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}
        >
          {title}
        </h3>
        <p className="text-sm font-medium text-neutral-500">{subtitle}</p>
      </div>
      <button
        onClick={onViewAll}
        className={`group flex items-center gap-1 text-sm font-medium transition-colors ${
          isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
        }`}
      >
        Ver todas{' '}
        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}

interface MovieRowItem {
  id: number;
  title: string;
  rating?: string;
  imageUrl: string;
}

function MovieRow({
  movies,
  isDark,
  onSelect,
}: {
  movies: MovieRowItem[];
  isDark: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="hide-scrollbar snap-x overflow-x-auto pb-10">
      <div className="flex gap-6">
        {movies.map((movie) => (
          <div key={movie.id} className="snap-start pt-2">
            <MovieCard
              title={movie.title}
              rating={movie.rating}
              movieId={movie.id}
              imageUrl={movie.imageUrl}
              isDark={isDark}
              onClick={() => onSelect(movie.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyRow({ message, isDark }: { message: string; isDark: boolean }) {
  return (
    <div
      className={`rounded-xl border-2 border-dashed p-8 text-center ${
        isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'
      }`}
    >
      <p className={`text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
        {message}
      </p>
    </div>
  );
}
