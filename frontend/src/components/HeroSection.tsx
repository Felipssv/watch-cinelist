import { Play, Plus, Star, Clock, Check } from 'lucide-react'; 
import { useEffect, useRef } from 'react';

interface HeroSectionProps {
  title: string;
  description: string;
  imageUrl: string;
  tag?: string;
  genre?: string;
  rating?: string;
  duration?: string;
  year?: string;
  isDark?: boolean;
  // Novas propriedades para os botões:
  onPlayClick?: () => void;
  onListClick?: () => void;
  isInList?: boolean;
}

export function HeroSection({
  title,
  description,
  imageUrl,
  tag = 'Filme da Semana',
  genre = 'Sci-Fi',
  rating = '8.8',
  duration = '2h 46min',
  year = '2024',
  isDark = false,
  onPlayClick,
  onListClick,
  isInList = false,
}: HeroSectionProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!imgRef.current) return;
      const scrollY = window.scrollY;
      imgRef.current.style.transform = `translateY(${scrollY * 0.35}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      className={`relative flex w-full items-end overflow-hidden ${isDark ? 'bg-neutral-950' : 'bg-white'}`}
      style={{ minHeight: '92vh' }}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Destaque"
          className="h-full w-full object-cover will-change-transform"
          style={{
            opacity: isDark ? 0.9 : 0.82,
            minHeight: '110%',
            top: '-5%',
            position: 'absolute',
            left: 0,
            right: 0,
            objectFit: 'cover',
          }}
        />

        {/* Side gradient (left) */}
        {isDark ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/20 via-transparent to-neutral-950/40"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/40"></div>
          </>
        )}

        {/* Cinema Vignette Effect */}
        {isDark ? (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(0,0,0,0.2)_85%,rgba(0,0,0,0.45)_100%)]"></div>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(0,0,0,0.08)_85%,rgba(0,0,0,0.25)_100%)]"></div>
        )}

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10"
          style={{
            height: '38%',
            background: isDark
              ? 'linear-gradient(to bottom, transparent 0%, rgba(9,9,11,0.55) 40%, rgba(9,9,11,0.88) 70%, rgb(9,9,11) 100%)'
              : 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.9) 70%, rgb(255,255,255) 100%)',
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-6 pb-16 pt-44">
        <div className="max-w-2xl">
          {/* Tags */}
          <div className="mb-5 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-red-500">
              {tag}
            </span>
            <span className={`h-px w-8 ${isDark ? 'bg-neutral-700' : 'bg-neutral-400'}`}></span>
            <span className={`text-xs font-medium uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {genre}
            </span>
          </div>

          {/* Title */}
          <h2 className={`mb-5 text-5xl font-bold leading-[1.1] tracking-tighter md:text-7xl ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {title}
          </h2>

          {/* Rating + Duration + Year */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {rating}
              </span>
              <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/10</span>
            </div>

            <span className={`h-3.5 w-px ${isDark ? 'bg-neutral-700' : 'bg-neutral-400'}`}></span>

            <div className="flex items-center gap-1.5">
              <Clock size={14} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
              <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {duration}
              </span>
            </div>

            <span className={`h-3.5 w-px ${isDark ? 'bg-neutral-700' : 'bg-neutral-400'}`}></span>

            <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {year}
            </span>
          </div>

          <p className={`mb-10 max-w-xl text-lg font-light leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {description}
          </p>

          {/* Action Buttons - Agora funcionais! */}
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={onPlayClick}
              className={`flex items-center gap-2 rounded-full px-8 py-3.5 font-semibold transition-colors ${isDark ? 'bg-white text-neutral-900 hover:bg-neutral-200' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}
            >
              <Play size={18} className={isDark ? 'fill-neutral-900' : 'fill-white'} /> Assistir
            </button>
            
            <button 
              onClick={onListClick}
              className={`flex items-center gap-2 rounded-full border px-8 py-3.5 font-semibold backdrop-blur-md transition-colors ${
                isInList 
                  ? isDark ? 'border-red-500 bg-red-500/20 text-red-100 hover:bg-red-500/30' : 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                  : isDark ? 'border-neutral-700 bg-neutral-900/50 text-white hover:bg-neutral-800' : 'border-neutral-300 bg-white/80 text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {isInList ? <Check size={18} /> : <Plus size={18} />} 
              {isInList ? 'Na Lista' : 'Minha Lista'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}