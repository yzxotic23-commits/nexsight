'use client'

import ThemeProvider from '@/components/ThemeProvider'

export default function ThemeProviderWrapper({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>
}