import { Play } from 'lucide-react';

interface MovieCardProps {
  title: string;
  imageUrl: string;
  rating?: string;
  id?: string;
  isDark?: boolean;
}

export function MovieCard({ title, imageUrl, rating, id, isDark = false }: MovieCardProps) {
  return (
    <div className={`group flex-shrink-0 w-56 overflow-hidden rounded-lg border shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white'}`}>
      {/* Image Container */}
      <div className="relative h-80 overflow-hidden bg-black">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover opacity-90 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center justify-center rounded-full border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <Play size={24} className="ml-1 fill-white text-white" />
          </div>
        </div>
      </div>

      {/* VHS Tape Bar - barra preta com listra vermelha */}
      <div className="relative h-[6px] bg-[#171717] flex-shrink-0">
        <div className="absolute left-4 top-0 h-full w-12 bg-red-600"></div>
      </div>

      {/* VHS Tape Label */}
      <div className={`relative p-4 ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f4f1ea]'}`}>
        {/* Movie Title - Handwritten Style */}
        <div className="flex min-h-[64px] flex-col justify-center">
          <h3 className={`handwritten -rotate-2 text-3xl font-bold leading-none tracking-tight ${isDark ? 'text-neutral-100' : 'text-black'}`}>
            {title}
          </h3>
        </div>

        {/* Footer Details */}
        <div className={`mt-4 flex items-end justify-between border-t pt-2 ${isDark ? 'border-neutral-700/60' : 'border-neutral-300/60'}`}>
          <span className={`font-mono text-[10px] font-medium tracking-wider ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
            {id || 'ID: 0000'}
          </span>
          {rating && (
            <span className={`rounded-sm px-2 py-0.5 text-xs font-bold ${isDark ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-200 text-neutral-900'}`}>
              {rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}