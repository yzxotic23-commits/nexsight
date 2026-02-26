'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/lib/stores/themeStore'

export default function ThemeProvider({ children }) {
  const { theme, setTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Ensure theme is applied on mount
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
