import api from './api';
import type {
  Review,
  ReviewInput,
  ReviewListResponse,
} from '../types/review';

/** Constroi o corpo aceito pelo backend a partir do input da UI (rating 1-5). */
function toApiPayload(input: ReviewInput) {
  return {
    content: input.content,
    rating: input.rating ?? undefined,
    title: input.title ?? undefined,
    is_public: input.is_public,
  };
}

export async function createReview(
  movieId: number,
  input: ReviewInput
): Promise<Review> {
  const { data } = await api.post<Review>(
    `/movies/${movieId}/reviews`,
    toApiPayload(input)
  );
  return data;
}

export async function fetchMovieReviews(
  movieId: number,
  skip = 0,
  limit = 20
): Promise<ReviewListResponse> {
  const { data } = await api.get<ReviewListResponse>(
    `/movies/${movieId}/reviews`,
    { params: { skip, limit } }
  );
  return data;
}

export async function fetchUserReviews(
  userId: string,
  skip = 0,
  limit = 100
): Promise<ReviewListResponse> {
  const { data } = await api.get<ReviewListResponse>(
    `/users/${userId}/reviews`,
    { params: { skip, limit } }
  );
  return data;
}

export async function fetchReviewById(reviewId: string): Promise<Review> {
  const { data } = await api.get<Review>(`/reviews/${reviewId}`);
  return data;
}

export async function updateReview(
  reviewId: string,
  input: Partial<ReviewInput>
): Promise<Review> {
  const { data } = await api.put<Review>(
    `/reviews/${reviewId}`,
    toApiPayload(input as ReviewInput)
  );
  return data;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete(`/reviews/${reviewId}`);
}
