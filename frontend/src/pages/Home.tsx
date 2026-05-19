import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. Import do hook de navegação
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HeroSection } from '../components/HeroSection';
import { MovieCard } from '../components/MovieCard';
import { ChevronRight, Loader2 } from 'lucide-react';
import { MovieModal } from '../components/MovieModal'; 
import { useThemeStore } from '../store/themeStore';
import { useListStore } from '../store/listStore';

export default function Home() {
  const { isDark } = useThemeStore(); 
  const { addToList, removeFromList, isInList, watched } = useListStore();
  
  const navigate = useNavigate(); // <-- 2. Instanciando o navigate

  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/movies')
      .then(res => res.json())
      .then(data => {
        setMovies(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar filmes:", err);
        setIsLoading(false);
      });
  }, []);

  const featuredMovie = movies.length > 0 ? movies[0] : null;

  const lastReturns = watched.map(movie => ({
    originalId: movie.id,
    id: `ID: ${movie.id}`,
    title: movie.title,
    rating: movie.tmdb_rating?.toFixed(1),
    imageUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
  }));

  const trendingMovies = movies.slice(0, 5).map(movie => ({
    originalId: movie.id,
    id: `ID: ${movie.id}`,
    title: movie.title,
    rating: movie.tmdb_rating?.toFixed(1),
    imageUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
  }));

  const newReleases = movies.slice(5, 10).map(movie => ({
    originalId: movie.id,
    id: `ID: ${movie.id}`,
    title: movie.title,
    rating: movie.tmdb_rating?.toFixed(1),
    imageUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
  }));

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950 selection:bg-red-900 selection:text-white' : 'bg-white selection:bg-red-100 selection:text-red-900'}`}>
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
                description={featuredMovie.overview || "Sinopse não disponível."}
                imageUrl={featuredMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}` : ""}
                tag="Em Destaque"
                genre={featuredMovie.genres && featuredMovie.genres.length > 0 ? featuredMovie.genres[0].name : "Filme"}
                rating={featuredMovie.tmdb_rating?.toFixed(1) || "N/A"}
                year={featuredMovie.release_year?.toString() || ""}
                isDark={isDark}
                onPlayClick={() => setSelectedMovieId(featuredMovie.id.toString())}
                isInList={isInList('watchlist', featuredMovie.id)}
                onListClick={() => {
                  if (isInList('watchlist', featuredMovie.id)) {
                    removeFromList('watchlist', featuredMovie.id);
                  } else {
                    addToList('watchlist', featuredMovie);
                  }
                }}
              />
            )}

            <div className="mx-auto max-w-7xl px-6 py-12">
              {/* Recently Watched Section */}
              <section className="mb-20">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <h3 className={`mb-2 text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>Assistidos Recentemente</h3>
                    <p className="text-sm font-medium text-neutral-500">
                      Os filmes que você assistiu nos últimos dias.
                    </p>
                  </div>
                  {/* 3. Redireciona para Minha Lista */}
                  <button 
                    onClick={() => navigate('/minha-lista', { state: { tab: 'watched' } })}
                    className={`group flex items-center gap-1 text-sm font-medium transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
                  >
                    Ver todas{' '}
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                {lastReturns.length > 0 ? (
                  <div className="hide-scrollbar snap-x overflow-x-auto pb-10">
                    <div className="flex gap-6">
                      {lastReturns.map((movie) => (
                        <div key={movie.id} className="snap-start pt-2">
                          <MovieCard
                            title={movie.title}
                            rating={movie.rating}
                            id={movie.id}
                            imageUrl={movie.imageUrl}
                            isDark={isDark}
                            onClick={() => setSelectedMovieId(movie.originalId.toString())}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-lg border-2 border-dashed p-8 text-center ${isDark ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Você ainda não marcou nenhum filme como assistido.
                    </p>
                  </div>
                )}
              </section>

              {/* Trending Section */}
              <section className="mb-20">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <h3 className={`mb-2 text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>Em Alta</h3>
                    <p className="text-sm font-medium text-neutral-500">
                      Os filmes mais populares do momento.
                    </p>
                  </div>
                  {/* 4. Redireciona para Filmes com o state "popular" */}
                  <button 
                    onClick={() => navigate('/filmes', { state: { filter: 'popular' } })}
                    className={`group flex items-center gap-1 text-sm font-medium transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
                  >
                    Ver todas{' '}
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="hide-scrollbar snap-x overflow-x-auto pb-10">
                  <div className="flex gap-6">
                    {trendingMovies.map((movie) => (
                      <div key={movie.id} className="snap-start pt-2">
                        <MovieCard
                          title={movie.title}
                          rating={movie.rating}
                          id={movie.id}
                          imageUrl={movie.imageUrl}
                          isDark={isDark}
                          onClick={() => setSelectedMovieId(movie.originalId.toString())}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* New Releases Section */}
              <section className="mb-20">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <h3 className={`mb-2 text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>Lançamentos</h3>
                    <p className="text-sm font-medium text-neutral-500">
                      Os filmes mais recentes que chegaram.
                    </p>
                  </div>
                  {/* 5. Redireciona para Filmes com o state "now_playing" */}
                  <button 
                    onClick={() => navigate('/filmes', { state: { filter: 'now_playing' } })}
                    className={`group flex items-center gap-1 text-sm font-medium transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
                  >
                    Ver todas{' '}
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="hide-scrollbar snap-x overflow-x-auto pb-10">
                  <div className="flex gap-6">
                    {newReleases.map((movie) => (
                      <div key={movie.id} className="snap-start pt-2">
                        <MovieCard
                          title={movie.title}
                          rating={movie.rating}
                          id={movie.id}
                          imageUrl={movie.imageUrl}
                          isDark={isDark}
                          onClick={() => setSelectedMovieId(movie.originalId.toString())}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
      
      <Footer />

      {selectedMovieId && (
        <MovieModal 
          movieId={selectedMovieId} 
          onClose={() => setSelectedMovieId(null)} 
        />
      )}
    </div>
  );
}