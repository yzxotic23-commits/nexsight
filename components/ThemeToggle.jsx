'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/lib/stores/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="relative bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-150"
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}
