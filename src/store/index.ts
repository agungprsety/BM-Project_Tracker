import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  language: 'en' | 'id';
  setLanguage: (lang: 'en' | 'id') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setDarkMode: (darkMode) => set({ darkMode }),
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-storage',
    }
  )
);
