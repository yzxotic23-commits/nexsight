'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/stores/themeStore'

export default function ThemeProvider({ children }) {
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    // Apply theme on mount
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [theme])

  return <>{children}</>
}
