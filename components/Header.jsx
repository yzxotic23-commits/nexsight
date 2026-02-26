'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { logout } from '@/lib/auth'
import { Search, Bell, Settings, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useFilterStore } from '@/lib/stores/filterStore'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'
import Link from 'next/link'

export default function Header() {
  const { user: session } = useAuth()
  const { selectedMonth, setSelectedMonth } = useFilterStore()
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const monthDropdownRef = useRef(null)

  const months = []
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i)
    months.push({
      value: i,
      label: format(date, 'MMMM yyyy'),
    })
  }

  const handleMonthSelect = (monthIndex) => {
    const newDate = subMonths(new Date(), monthIndex)
    setSelectedMonth({
      start: startOfMonth(newDate),
      end: endOfMonth(newDate),
      label: format(newDate, 'MMMM yyyy'),
    })
    setIsMonthDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false)
      }
    }
    if (isMonthDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMonthDropdownOpen])

  return (
    <header className="h-16 bg-white dark:bg-dark-card flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <img 
          src="/logo/nexsight.jpg" 
          alt="NexSight Logo" 
          className="h-8 w-8 object-contain"
        />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">NexSight</h2>
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

        <ThemeToggle />

        {/* Settings button - only show for Admin and Manager */}
        {(session?.role === 'Admin' || session?.role === 'Manager') && (
          <Link href="/dashboard/settings">
            <button className="bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-150">
              <Settings className="h-4 w-4" />
            </button>
          </Link>
        )}

        <div className="relative" ref={monthDropdownRef}>
          <button
            onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            style={{ backgroundColor: '#DEC05F' }}
          >
            <Calendar className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
            <span className="text-gray-900 dark:text-gray-900">{selectedMonth.label}</span>
            {isMonthDropdownOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
            )}
          </button>
          {isMonthDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-900 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {months.map((month) => (
                <button
                  key={month.value}
                  onClick={() => handleMonthSelect(month.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedMonth.label === month.label
                      ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold-400 font-medium'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {month.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-900" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {session?.name || 'Admin User'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-300">
              {session?.role || 'admin'}
            </span>
          </div>
          <button
            onClick={async () => {
              await logout()
              window.location.href = '/'
            }}
            className="ml-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
