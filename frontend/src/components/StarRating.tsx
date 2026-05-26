import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  readonly?: boolean;
  isDark?: boolean;
}

export function StarRating({
  value,
  onChange,
  max = 10,
  size = 20,
  readonly = false,
  isDark = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const display = hovered ?? value;

  function valueFromEvent(e: React.MouseEvent<HTMLButtonElement>, starIndex: number): number {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    return isLeftHalf ? starIndex + 0.5 : starIndex + 1;
  }

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={`Avaliacao ${value} de ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const full = i + 1;
        const half = i + 0.5;
        const filled = display >= full;
        const isHalf = !filled && display >= half;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={(e) => onChange?.(valueFromEvent(e, i))}
            onMouseMove={(e) => { if (!readonly) setHovered(valueFromEvent(e, i)); }}
            onMouseLeave={() => { if (!readonly) setHovered(null); }}
            className={`transition-transform ${!readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            aria-label={`${full} de ${max}`}
          >
            <Star
              size={size}
              className={`transition-colors ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : isDark
                      ? 'fill-neutral-700 text-neutral-600'
                      : 'fill-neutral-200 text-neutral-300'
              }`}
            />
          </button>
        );
      })}
      {!readonly && (
        <span className={`ml-2 text-sm font-semibold tabular-nums ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
          {display.toFixed(1)}
        </span>
      )}
    </div>
  );
}
