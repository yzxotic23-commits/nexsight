import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { startOfMonth, endOfMonth, format } from 'date-fns'

const getCurrentMonth = () => {
  // Use current date - ensure we use local timezone consistently
  const now = new Date() // Current date in local timezone
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  
  // Log for debugging - show both ISO and local format
  console.log('Creating current month for:', {
    now: now.toISOString(),
    nowLocal: format(now, 'yyyy-MM-dd HH:mm:ss'),
    start: start.toISOString(),
    startLocal: format(start, 'yyyy-MM-dd'),
    end: end.toISOString(),
    endLocal: format(end, 'yyyy-MM-dd'),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  
  return {
    start: start,
    end: end,
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
      // But only if the stored month is not the current month
      onRehydrateStorage: () => (state) => {
        if (state && state.selectedMonth) {
          const currentMonth = getCurrentMonth()
          const storedStart = state.selectedMonth.start instanceof Date 
            ? state.selectedMonth.start 
            : new Date(state.selectedMonth.start)
          const currentStart = currentMonth.start
          
          // Check if stored month is different from current month
          const storedMonthKey = format(storedStart, 'yyyy-MM')
          const currentMonthKey = format(currentStart, 'yyyy-MM')
          
          console.log('FilterStore hydration:', {
            storedMonth: storedMonthKey,
            currentMonth: currentMonthKey,
            willReset: storedMonthKey !== currentMonthKey
          })
          
          // Only reset if stored month is different from current month
          if (storedMonthKey !== currentMonthKey) {
            console.log('Resetting to current month due to month mismatch')
            state.selectedMonth = currentMonth
          } else {
            // Ensure dates are Date objects, not strings
            if (!(state.selectedMonth.start instanceof Date)) {
              state.selectedMonth.start = new Date(state.selectedMonth.start)
            }
            if (!(state.selectedMonth.end instanceof Date)) {
              state.selectedMonth.end = new Date(state.selectedMonth.end)
            }
          }
        } else if (state) {
          // No stored month, set to current
          state.selectedMonth = getCurrentMonth()
        }
      },
    }
  )
)
