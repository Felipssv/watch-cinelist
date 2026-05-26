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
  max = 5,
  size = 20,
  readonly = false,
  isDark = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const display = hovered ?? value;
  const stars = max === 10 ? 5 : max;
  const scale = max / stars;

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={`Avaliacao ${value} de ${max}`}>
      {Array.from({ length: stars }, (_, i) => {
        const starValue = (i + 1) * scale;
        const halfValue = starValue - scale / 2;
        const filled = display >= starValue;
        const half = !filled && display >= halfValue;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHovered(starValue)}
            onMouseLeave={() => !readonly && setHovered(null)}
            className={`transition-transform ${!readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            aria-label={`${starValue} de ${max}`}
          >
            <Star
              size={size}
              className={`transition-colors ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : half
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
