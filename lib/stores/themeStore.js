import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark'
          if (typeof window !== 'undefined') {
            const root = document.documentElement
            if (newTheme === 'dark') {
              root.classList.add('dark')
            } else {
              root.classList.remove('dark')
            }
          }
          return { theme: newTheme }
        }),
      setTheme: (theme) => {
        if (typeof window !== 'undefined') {
          const root = document.documentElement
          if (theme === 'dark') {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }
        set({ theme })
      },
    }),
    {
      name: 'nexsight-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
