import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createReview,
  deleteReview,
  fetchMovieReviews,
  fetchUserReviews,
  updateReview,
} from '../services/reviews';
import { useAuthStore } from '../store/authStore';
import type { Review, ReviewInput } from '../types/review';

export const reviewKeys = {
  all: ['reviews'] as const,
  byMovie: (movieId: number) => [...reviewKeys.all, 'movie', movieId] as const,
  byUser: (userId: string) => [...reviewKeys.all, 'user', userId] as const,
};

/** Reviews (publicas) de um filme. */
export function useMovieReviews(movieId: number | null) {
  return useQuery({
    queryKey: reviewKeys.byMovie(movieId ?? 0),
    queryFn: () => fetchMovieReviews(movieId!),
    enabled: movieId !== null && !Number.isNaN(movieId),
    staleTime: 2 * 60 * 1000,
  });
}

/** Reviews de um usuario (inclui privadas quando e o proprio usuario logado). */
export function useUserReviews(userId: string | null) {
  return useQuery({
    queryKey: reviewKeys.byUser(userId ?? ''),
    queryFn: () => fetchUserReviews(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Reviews do usuario atualmente logado. Conveniencia usada por MyList e pelos
 * modais para descobrir "minha review do filme X" sem depender de endpoint
 * dedicado.
 */
export function useMyReviews() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useUserReviews(userId);
}

/**
 * Invalida os caches relevantes apos uma mutacao de review: a lista do filme
 * afetado e a lista de reviews do autor.
 */
function useInvalidateReviews() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  return (movieId: number) => {
    queryClient.invalidateQueries({ queryKey: reviewKeys.byMovie(movieId) });
    if (currentUserId) {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.byUser(currentUserId),
      });
    }
  };
}

export function useCreateReview() {
  const invalidate = useInvalidateReviews();

  return useMutation({
    mutationFn: ({ movieId, input }: { movieId: number; input: ReviewInput }) =>
      createReview(movieId, input),
    onSuccess: (review: Review) => invalidate(review.movie_id),
  });
}

export function useUpdateReview() {
  const invalidate = useInvalidateReviews();

  return useMutation({
    mutationFn: ({
      reviewId,
      input,
    }: {
      reviewId: string;
      input: Partial<ReviewInput>;
    }) => updateReview(reviewId, input),
    onSuccess: (review: Review) => invalidate(review.movie_id),
  });
}

export function useDeleteReview() {
  const invalidate = useInvalidateReviews();

  return useMutation({
    // movieId so e usado para invalidar o cache do filme apos o delete.
    mutationFn: ({ reviewId }: { reviewId: string; movieId: number }) =>
      deleteReview(reviewId),
    onSuccess: (_data, variables) => invalidate(variables.movieId),
  });
}
