'use client'

import { SessionProvider } from 'next-auth/react'
import ThemeProvider from '@/components/ThemeProvider'
import Sidebar from '@/components/Sidebar'
import { useUIStore } from '@/lib/stores/uiStore'

export default function DashboardLayout({ children }) {
  const { sidebarCollapsed } = useUIStore()
  
  return (
    <SessionProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors">
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 p-6 lg:ml-0 overflow-x-hidden overflow-y-auto transition-all duration-300">{children}</main>
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  )
}
