import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Review {
  movieId: number;
  movieTitle: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewState {
  reviews: Review[];
  upsertReview: (review: Omit<Review, 'createdAt' | 'updatedAt'>) => void;
  removeReview: (movieId: number) => void;
  getReview: (movieId: number) => Review | undefined;
  hasReview: (movieId: number) => boolean;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],

      upsertReview: (review) =>
        set((state) => {
          const now = new Date().toISOString();
          const existing = state.reviews.find((r) => r.movieId === review.movieId);
          if (existing) {
            return {
              reviews: state.reviews.map((r) =>
                r.movieId === review.movieId
                  ? { ...review, createdAt: r.createdAt, updatedAt: now }
                  : r
              ),
            };
          }
          return {
            reviews: [
              ...state.reviews,
              { ...review, createdAt: now, updatedAt: now },
            ],
          };
        }),

      removeReview: (movieId) =>
        set((state) => ({
          reviews: state.reviews.filter((r) => r.movieId !== movieId),
        })),

      getReview: (movieId) => get().reviews.find((r) => r.movieId === movieId),

      hasReview: (movieId) =>
        get().reviews.some((r) => r.movieId === movieId),
    }),
    { name: 'cinelist-reviews' }
  )
);
