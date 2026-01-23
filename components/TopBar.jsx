'use client'

import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/lib/toast-context'
import { Search, Bell, HelpCircle, Settings, User, ChevronDown, Power, ArrowLeft } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useFilterStore } from '@/lib/stores/filterStore'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function TopBar() {
  const { data: session } = useSession()
  const { selectedMonth, setSelectedMonth } = useFilterStore()
  const pathname = usePathname()
  const { showToast } = useToast()
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Overview'
    if (pathname?.includes('/deposit')) return 'Deposit Monitor'
    if (pathname?.includes('/withdraw')) return 'Withdraw Monitor'
    if (pathname?.includes('/wealth')) return 'Bank Account Rental'
    if (pathname?.includes('/bank')) return 'Wealth+ Accounts'
    if (pathname?.includes('/settings')) return 'Settings'
    return 'Dashboard'
  }

  const handleMonthChange = (e) => {
    const monthIndex = parseInt(e.target.value)
    const newDate = subMonths(new Date(), monthIndex)
    setSelectedMonth({
      start: startOfMonth(newDate),
      end: endOfMonth(newDate),
      label: format(newDate, 'MMMM yyyy'),
    })
  }

  const months = []
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i)
    months.push({
      value: i,
      label: format(date, 'MMMM yyyy'),
    })
  }

  return (
    <div className="h-16 bg-light-bg dark:bg-dark-bg flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {pathname?.includes('/settings') ? (
          <Link href="/dashboard" className="inline-flex items-center gap-2 p-2 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Back To Dashboard</span>
          </Link>
        ) : (
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 w-56"
          />
        </div>

        <button className="relative bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-150">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>

        <button className="bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-150">
            <HelpCircle className="h-4 w-4" />
          </button>

          <ThemeToggle />

          <Link href="/dashboard/settings" className="bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-150">
            <Settings className="h-4 w-4" />
          </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-300 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-900" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {session?.user?.name || 'Martin Septimus'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-300">
              {session?.user?.role || 'Admin'}
            </span>
          </div>
          <div className="relative" ref={userDropdownRef}>
            <button 
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="ml-3 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors flex items-center justify-center"
              title="User Menu"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-900 rounded-lg shadow-lg z-50">
                <button
                    onClick={() => {
                      showToast('Logging out...', 'success')
                      setTimeout(() => {
                        signOut({ callbackUrl: '/login' })
                      }, 500)
                      setIsUserDropdownOpen(false)
                    }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                >
                  <Power className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
