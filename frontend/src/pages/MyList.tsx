import { useState, useEffect } from 'react'; 
import { useLocation } from 'react-router-dom'; 
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MovieCard } from '../components/MovieCard';
import { Search, Trash2 } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useListStore } from '../store/listStore';
import { MovieModal } from '../components/MovieModal';

type ListType = 'favorites' | 'watchlist' | 'watched';

export default function MyList() {
  const { isDark } = useThemeStore();
  const location = useLocation(); 
  
  const [activeTab, setActiveTab] = useState<ListType>(
  (location.state?.tab as ListType) || 'favorites'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  const { favorites, watchlist, watched, removeFromList } = useListStore();

  //Força a página a rolar para o topo ao carregar 
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const getMovies = () => {
    const lists = { favorites, watchlist, watched };
    return lists[activeTab] || [];
  };

  const filteredMovies = getMovies().filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const movieCards = filteredMovies.map(movie => ({
    originalId: movie.id, 
    id: `ID: ${movie.id}`, 
    title: movie.title,
    rating: movie.tmdb_rating?.toFixed(1),
    imageUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
  }));

  const getTabLabel = (tab: ListType) => {
    switch (tab) {
      case 'favorites': return `Favoritos (${favorites.length})`;
      case 'watchlist': return `Desejo Assistir (${watchlist.length})`;
      case 'watched': return `Já Assistidos (${watched.length})`;
      default: return '';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950 selection:bg-red-900 selection:text-white' : 'bg-white selection:bg-red-100 selection:text-red-900'}`}>
      <Header currentPage="watchlist" />

      <main className="pt-20">
        <div className={`border-b ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'} py-12`}>
          <div className="mx-auto max-w-7xl px-6">
            <h1 className={`mb-4 text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Minha Lista
            </h1>
            <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Organize seus filmes e séries preferidos
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800">
            {(['favorites', 'watchlist', 'watched'] as ListType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? isDark ? 'border-b-2 border-red-600 text-white' : 'border-b-2 border-red-600 text-neutral-900'
                    : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {getTabLabel(tab)}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
              <input
                type="text"
                placeholder="Procure nos seus filmes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-lg border px-12 py-3 transition-colors ${
                  isDark ? 'border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:border-red-600 focus:outline-none'
                         : 'border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-red-600 focus:outline-none'
                }`}
              />
            </div>
          </div>

          <div>
            <div className="mb-4">
              <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {filteredMovies.length} item{filteredMovies.length !== 1 ? 'ns' : ''} nesta lista
              </p>
            </div>

            {movieCards.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {movieCards.map((movie) => (
                  <div key={movie.id} className="group relative">
                    <MovieCard
                      title={movie.title}
                      rating={movie.rating}
                      id={movie.id}
                      imageUrl={movie.imageUrl}
                      isDark={isDark}
                      onClick={() => setSelectedMovieId(movie.originalId.toString())} 
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        removeFromList(activeTab, movie.originalId);
                      }}
                      className={`absolute right-3 top-3 rounded-full p-2 transition-all ${
                        isDark ? 'bg-red-600/0 text-red-400 hover:bg-red-600/80 hover:text-white group-hover:bg-red-600/20'
                               : 'bg-red-100/0 text-red-500 hover:bg-red-600/80 hover:text-white group-hover:bg-red-100'
                      }`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center py-16 text-center ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                <Search size={48} className="mb-4 opacity-50" />
                <h3 className="mb-2 text-xl font-semibold">
                  {searchQuery ? 'Nenhum item encontrado' : 'Lista vazia'}
                </h3>
                <p>
                  {searchQuery ? 'Tente procurar por outro título' : 'Comece a adicionar filmes e séries à sua lista'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer/>

      {selectedMovieId && (
        <MovieModal 
          movieId={selectedMovieId} 
          onClose={() => setSelectedMovieId(null)} 
        />
      )}
    </div>
  );
}