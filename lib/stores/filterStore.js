import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { startOfMonth, endOfMonth, format } from 'date-fns'

const getCurrentMonth = () => {
  // Force current date to January 24, 2026
  const now = new Date(2026, 0, 24) // January 2026 (month is 0-indexed)
  console.log('Creating current month for:', now.toISOString())
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
    label: format(now, 'MMMM yyyy'),
  }
}

export const useFilterStore = create(
  persist(
    (set, get) => ({
      // Month filter - always use current month on initialization
      selectedMonth: getCurrentMonth(),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      
      // Reset to current month (useful for debugging)
      resetToCurrentMonth: () => set({ selectedMonth: getCurrentMonth() }),

      // Currency filter (only for Deposit & Withdraw)
      selectedCurrency: 'MYR',
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

      // Date range (for future use)
      dateRange: null,
      setDateRange: (range) => set({ dateRange: range }),
    }),
    {
      name: 'nexsight-filters',
      // Force reset to current month on hydration to avoid stale data
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.selectedMonth = getCurrentMonth()
        }
      },
    }
  )
)
