import { useState, useEffect } from 'react';
import { X, Trash2, PenLine } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useReviewStore } from '../store/reviewStore';
import { StarRating } from './StarRating';

interface ReviewModalProps {
  movieId: number;
  movieTitle: string;
  onClose: () => void;
}

export function ReviewModal({ movieId, movieTitle, onClose }: ReviewModalProps) {
  const { isDark } = useThemeStore();
  const { getReview, upsertReview, removeReview } = useReviewStore();

  const existing = getReview(movieId);
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [text, setText] = useState(existing?.text ?? '');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  const handleSave = () => {
    if (!text.trim() && rating === 0) return;
    upsertReview({ movieId, movieTitle, rating, text: text.trim() });
    handleClose();
  };

  const handleDelete = () => {
    removeReview(movieId);
    handleClose();
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`relative w-full max-w-lg overflow-hidden rounded-xl shadow-2xl ${
            isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10">
                <PenLine size={16} className="text-red-500" />
              </div>
              <div>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {existing ? 'Editar review' : 'Escrever review'}
                </h2>
                <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} title={movieTitle}>
                  {movieTitle.length > 40 ? `${movieTitle.slice(0, 40)}…` : movieTitle}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`rounded-full p-1.5 transition-colors ${isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'}`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div>
              <p className={`mb-2 text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                Sua nota
              </p>
              <StarRating
                value={rating}
                onChange={setRating}
                max={10}
                size={24}
                isDark={isDark}
              />
            </div>

            <div>
              <label
                htmlFor="review-text"
                className={`mb-2 block text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}
              >
                O que achou?
              </label>
              <textarea
                id="review-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva sua opiniao sobre o filme..."
                rows={5}
                className={`w-full resize-none rounded-lg border px-4 py-3 text-sm leading-relaxed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 ${
                  isDark
                    ? 'border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500'
                    : 'border-neutral-300 bg-neutral-50 text-neutral-900 placeholder-neutral-400'
                }`}
              />
            </div>
          </div>

          <div className={`flex items-center justify-between border-t px-6 py-4 ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
            {existing ? (
              <button
                onClick={handleDelete}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
              >
                <Trash2 size={15} />
                Excluir review
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!text.trim() && rating === 0}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
