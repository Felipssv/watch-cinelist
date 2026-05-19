import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ListMovie {
  id: number;
  title: string;
  poster_path: string | null;
  tmdb_rating: number | null;
}

type ListType = 'favorites' | 'watchlist' | 'watched';

interface ListState {
  favorites: ListMovie[];
  watchlist: ListMovie[];
  watched: ListMovie[];
  addToList: (listType: ListType, movie: ListMovie) => void;
  removeFromList: (listType: ListType, id: number) => void;
  isInList: (listType: ListType, id: number) => boolean;
}

export const useListStore = create<ListState>()(
  persist(
    (set, get) => ({
      favorites: [],
      watchlist: [],
      watched: [],
      
      addToList: (listType, movie) => set((state) => {
        // Evita duplicatas
        if (state[listType].find((m) => m.id === movie.id)) return state;
        return { [listType]: [...state[listType], movie] };
      }),
      
      removeFromList: (listType, id) => set((state) => ({
        [listType]: state[listType].filter((m) => m.id !== id),
      })),

      isInList: (listType, id) => {
        const state = get();
        return state[listType].some((m) => m.id === id);
      }
    }),
    {
      name: 'cinelist-storage', // Nome do cache no navegador
    }
  )
);