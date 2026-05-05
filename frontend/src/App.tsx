import { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MovieCard } from './components/MovieCard';
import { ChevronRight } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };
  const lastReturns = [
    {
      id: 'ID: 0824',
      title: 'Blade Runner',
      rating: '9.2',
      imageUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'ID: 1102',
      title: 'The Thing',
      rating: '8.8',
      imageUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'ID: 3301',
      title: 'Akira',
      rating: '8.5',
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'ID: 0045',
      title: 'Drive',
      rating: '8.1',
      imageUrl: 'https://images.unsplash.com/photo-1613679074971-91fc27180061?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'ID: 9921',
      title: 'Pulp Fiction',
      rating: '9.0',
      imageUrl: 'https://images.unsplash.com/photo-1594908122393-27150106941d?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'ID: 0101',
      title: 'Terminator',
      rating: '8.7',
      imageUrl: 'https://images.unsplash.com/photo-1585951237318-9ea5e175b891?auto=format&fit=crop&q=80&w=600',
    },
  ];

  const trendingMovies = [
    {
      id: 'ID: 2314',
      title: 'Interestelar',
      rating: '8.9',
      imageUrl: 'https://images.unsplash.com/photo-1561722798-9a732d141027?w=400&h=500&fit=crop',
    },
    {
      id: 'ID: 1210',
      title: 'Inception',
      rating: '9.1',
      imageUrl: 'https://images.unsplash.com/photo-1578671815798-7b9b0ab22d73?w=400&h=500&fit=crop',
    },
    {
      id: 'ID: 3017',
      title: 'Blade Runner 2049',
      rating: '8.7',
      imageUrl: 'https://images.unsplash.com/photo-1730303904038-308526f95092?w=400&h=500&fit=crop',
    },
    {
      id: 'ID: 4521',
      title: 'Dune',
      rating: '8.8',
      imageUrl: 'https://images.unsplash.com/photo-1609293519338-9e7a88404068?w=400&h=500&fit=crop',
    },
    {
      id: 'ID: 1999',
      title: 'The Matrix',
      rating: '9.3',
      imageUrl: 'https://images.unsplash.com/photo-1691814994093-bdba60cba4cc?w=400&h=500&fit=crop',
    },
  ];

  const newReleases = [
    {
      id: 'ID: 6723',
      title: 'Oppenheimer',
      rating: '9.0',
      imageUrl: 'https://images.unsplash.com/photo-1608170825938-a8ea0305d46c?w=400&h=500&fit=crop',
    },
    {
      id: 'ID: 6823',
      title: 'Flower Moon',
      rating: '8.6',
      imageUrl: 'https://images.unsplash.com/photo-1560405177-47dded9830ea?w=400&h=500&fit=crop',
    },
    {
      id: 'ID: 7023',
      title: 'Poor Things',
      rating: '8.4',
      imageUrl: 'https://images.unsplash.com/photo-1661860959714-812b529be430?w=400&h=500&fit=crop',
    },
    {
      id: 'ID: 6923',
      title: 'Zone of Interest',
      rating: '8.3',
      imageUrl: 'https://images.unsplash.com/photo-1730303906663-adbbd13bbdc4?w=400&h=500&fit=crop',
    },
    {
      id: 'ID: 7123',
      title: 'Anatomy of a Fall',
      rating: '8.5',
      imageUrl: 'https://images.unsplash.com/photo-1739433437912-cca661ba902f?w=400&h=500&fit=crop',
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950 selection:bg-red-900 selection:text-white' : 'bg-white selection:bg-red-100 selection:text-red-900'}`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} />

      <main>
        {/* Hero Section */}
        <HeroSection
          title="Dune: Parte Dois"
          description="Paul Atreides une-se a Chani e aos Fremen para vingar a conspiração que destruiu a sua família. Ao enfrentar a escolha entre o amor da sua vida e o destino do universo, ele tem de evitar o terrível futuro que só ele pode prever."
          imageUrl="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=2000"
          tag="Filme da Semana"
          genre="Sci-Fi"
          rating="8.8"
          duration="2h 46min"
          year="2024"
          isDark={isDark}
        />

        {/* Content Container */}
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
              <button className={`group flex items-center gap-1 text-sm font-medium transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'}`}>
                Ver todas{' '}
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>

            {/* Carousel Container */}
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
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Trending Section */}
          <section className="mb-20">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h3 className={`mb-2 text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>Em Alta Esta Semana</h3>
                <p className="text-sm font-medium text-neutral-500">
                  Os filmes mais assistidos nos últimos 7 dias.
                </p>
              </div>
              <button className={`group flex items-center gap-1 text-sm font-medium transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'}`}>
                Ver todas{' '}
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
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
                <h3 className={`mb-2 text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>Novos Lançamentos</h3>
                <p className="text-sm font-medium text-neutral-500">
                  Recém-adicionados ao acervo da CineList.
                </p>
              </div>
              <button className={`group flex items-center gap-1 text-sm font-medium transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'}`}>
                Ver todas{' '}
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
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
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className={`border-t py-8 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'}`}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-red-600">
                  <div className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-neutral-900' : 'bg-white'}`}></div>
                </div>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>CineList</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Gestão de Filmes e Séries
              </p>
              <p className="text-xs text-neutral-500">
                © 2026 CineList. Desenvolvido como trabalho de faculdade.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}