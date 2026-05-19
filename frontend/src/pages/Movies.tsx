import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';
import { Search, Loader2 } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

// 1. Definindo os tipos dos filtros baseados no TMDB
type FilterType = 'popular' | 'now_playing' | 'top_rated';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  tmdb_rating: number | null;
}

interface SearchResponse {
  results: Movie[];
  page: number;
  total_pages: number;
}

export default function Movies() {
  const { isDark } = useThemeStore();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Em vez de inicializar sempre com 'popular', ele verifica se recebeu algum filtro da Home
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (location.state?.filter as FilterType) || 'popular'
  );
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  // Faz a página rolar para o topo sempre que for carregada
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Debounce search query (evita fazer requisição a cada letra digitada)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch movies com infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    // 3. Incluímos o activeFilter na chave. Se ele mudar, o TanStack refaz a busca do zero!
    queryKey: ['movies', debouncedQuery, activeFilter],
    queryFn: async ({ pageParam = 1 }) => {
      
      // 4. Lógica da URL: Se tem busca de texto, usa o 'q='. Se não, usa o 'category='
      const endpoint = debouncedQuery 
        ? `http://localhost:8000/movies/search?q=${encodeURIComponent(debouncedQuery)}&page=${pageParam}`
        : `http://localhost:8000/movies/search?category=${activeFilter}&page=${pageParam}`;
      
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Erro ao buscar dados do servidor");
      return res.json() as Promise<SearchResponse>;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Achata todas as páginas de resultados em um único array
  const allMovies = data?.pages.flatMap(page => page.results) ?? [];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950 selection:bg-red-900 selection:text-white' : 'bg-white selection:bg-red-100 selection:text-red-900'}`}>
      <Header currentPage="movies" />

      <main className="pt-20">
        {/* Hero Banner */}
        <div className={`border-b ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'} py-12`}>
          <div className="mx-auto max-w-7xl px-6">
            <h1 className={`mb-4 text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Todos os Filmes
            </h1>
            <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {debouncedQuery ? 'Resultados da busca' : 'Navegue por nossa coleção completa de filmes'}
            </p>
          </div>
        </div>

        {/* Search Bar e Filtros */}
        <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
          <div className="relative mb-6">
            <Search
              size={20}
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}
            />
            <input
              type="text"
              placeholder="Procure por um filme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-lg border px-12 py-3 transition-colors ${
                isDark
                  ? 'border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:border-red-600 focus:outline-none'
                  : 'border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-red-600 focus:outline-none'
              }`}
            />
          </div>

          {/* 5. Botões de Filtro: Só aparecem se o usuário NÃO estiver pesquisando por texto */}
          {!debouncedQuery && (
            <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setActiveFilter('popular')}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeFilter === 'popular'
                    ? isDark ? 'border-b-2 border-red-600 text-white' : 'border-b-2 border-red-600 text-neutral-900'
                    : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Em Alta
              </button>
              <button
                onClick={() => setActiveFilter('now_playing')}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeFilter === 'now_playing'
                    ? isDark ? 'border-b-2 border-red-600 text-white' : 'border-b-2 border-red-600 text-neutral-900'
                    : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Lançamentos
              </button>
              <button
                onClick={() => setActiveFilter('top_rated')}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeFilter === 'top_rated'
                    ? isDark ? 'border-b-2 border-red-600 text-white' : 'border-b-2 border-red-600 text-neutral-900'
                    : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Melhor Avaliados
              </button>
            </div>
          )}
        </div>

        {/* Movies Grid */}
        <div className="mx-auto max-w-7xl px-6 pb-12">
          <div className="mb-6 mt-2">
            <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {status === 'pending' ? 'Carregando...' : `${allMovies.length} filme${allMovies.length !== 1 ? 's' : ''} carregado${allMovies.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {status === 'pending' ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className={`animate-spin ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} size={40} />
            </div>
          ) : allMovies.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allMovies.map((movie) => (
                  <MovieCard
                    key={`${movie.id}-${Math.random()}`} // Ajuste de key para listas infinitas
                    id={`ID: ${movie.id}`}
                    title={movie.title}
                    rating={movie.tmdb_rating?.toFixed(1)}
                    imageUrl={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''}
                    isDark={isDark}
                    onClick={() => setSelectedMovieId(movie.id)}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center pt-12">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
                      isDark
                        ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                        : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                    }`}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      'Carregar Mais'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={`flex flex-col items-center justify-center py-16 text-center ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <Search size={48} className="mb-4 opacity-50" />
              <h3 className="mb-2 text-xl font-semibold">
                {debouncedQuery ? 'Nenhum filme encontrado' : 'Nenhum filme disponível'}
              </h3>
              <p>
                {debouncedQuery
                  ? 'Tente procurar por outro título'
                  : 'Nenhum resultado para esta categoria.'}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer/>

      {/* 6. Movie Modal Limpo! Não precisa mais de onAddToFavorites etc, pois o próprio modal já fala com o Zustand. */}
      {selectedMovieId && (
        <MovieModal
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
        />
      )}
    </div>
  );
}