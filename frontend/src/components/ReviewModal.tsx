import { useState, useEffect } from 'react';
import { X, Trash2, PenLine, Loader2, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { StarRating } from './StarRating';
import {
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from '../hooks/useReviews';
import { extractErrorMessage } from '../hooks/useAuth';
import type { Review } from '../types/review';

interface ReviewModalProps {
  movieId: number;
  movieTitle: string;
  /** Review existente do usuario para este filme, se houver. */
  existingReview?: Review | null;
  onClose: () => void;
}

export function ReviewModal({
  movieId,
  movieTitle,
  existingReview,
  onClose,
}: ReviewModalProps) {
  const { isDark } = useThemeStore();

  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  const [rating, setRating] = useState(existingReview?.rating ?? 3);
  const [text, setText] = useState(existingReview?.content ?? '');
  const [visible, setVisible] = useState(false);

  const isEditing = !!existingReview;
  const isSaving = createReview.isPending || updateReview.isPending;
  const isDeleting = deleteReview.isPending;
  const isBusy = isSaving || isDeleting;

  const mutationError =
    createReview.error ?? updateReview.error ?? deleteReview.error;
  const errorMessage = mutationError ? extractErrorMessage(mutationError) : null;

  useEffect(() => {
    setVisible(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (isBusy) return;
    setVisible(false);
    onClose();
  };

  const handleSave = () => {
    const content = text.trim();
    // Backend exige content (min_length=1); rating ja esta na escala 1-5.
    if (!content) return;

    const input = { content, rating, is_public: true };

    if (isEditing) {
      updateReview.mutate(
        { reviewId: existingReview!.id, input },
        { onSuccess: () => handleCloseAfterMutation() }
      );
    } else {
      createReview.mutate(
        { movieId, input },
        { onSuccess: () => handleCloseAfterMutation() }
      );
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;
    deleteReview.mutate(
      { reviewId: existingReview!.id, movieId },
      { onSuccess: () => handleCloseAfterMutation() }
    );
  };

  const handleCloseAfterMutation = () => {
    setVisible(false);
    onClose();
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
                  {isEditing ? 'Editar review' : 'Escrever review'}
                </h2>
                <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} title={movieTitle}>
                  {movieTitle.length > 40 ? `${movieTitle.slice(0, 40)}…` : movieTitle}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isBusy}
              className={`rounded-full p-1.5 transition-colors disabled:opacity-40 ${isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'}`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <p className={`mb-2 text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                Sua nota
              </p>
              <StarRating
                value={rating}
                onChange={setRating}
                max={5}
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
                disabled={isBusy}
                className={`w-full resize-none rounded-lg border px-4 py-3 text-sm leading-relaxed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-60 ${
                  isDark
                    ? 'border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500'
                    : 'border-neutral-300 bg-neutral-50 text-neutral-900 placeholder-neutral-400'
                }`}
              />
            </div>
          </div>

          <div className={`flex items-center justify-between border-t px-6 py-4 ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
            {isEditing ? (
              <button
                onClick={handleDelete}
                disabled={isBusy}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
              >
                {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Excluir review
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                disabled={isBusy}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!text.trim() || isBusy}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving && <Loader2 size={15} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
