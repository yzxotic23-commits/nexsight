import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { startOfMonth, endOfMonth, format } from 'date-fns'

const getCurrentMonth = () => {
  const now = new Date()
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
    label: format(now, 'MMMM yyyy'),
  }
}

export const useFilterStore = create(
  persist(
    (set) => ({
      // Month filter
      selectedMonth: getCurrentMonth(),
      setSelectedMonth: (month) => set({ selectedMonth: month }),

      // Currency filter (only for Deposit & Withdraw)
      selectedCurrency: 'MYR',
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

      // Date range (for future use)
      dateRange: null,
      setDateRange: (range) => set({ dateRange: range }),
    }),
    {
      name: 'nexsight-filters',
    }
  )
)
