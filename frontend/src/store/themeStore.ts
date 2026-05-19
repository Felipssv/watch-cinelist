import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false, // Valor padrão (light mode)
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    {
      name: 'cinelist-theme', // Esse é o nome que vai ficar salvo no LocalStorage
    }
  )
);