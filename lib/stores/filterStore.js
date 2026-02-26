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
      setSelectedMonth: (month) => {
        // Ensure dates are Date objects and valid
        const validatedMonth = {
          start: month.start instanceof Date ? month.start : new Date(month.start),
          end: month.end instanceof Date ? month.end : new Date(month.end),
          label: month.label || format(month.start instanceof Date ? month.start : new Date(month.start), 'MMMM yyyy')
        }
        
        // Validate dates
        if (isNaN(validatedMonth.start.getTime()) || isNaN(validatedMonth.end.getTime())) {
          console.error('Invalid dates in setSelectedMonth, using current month instead')
          set({ selectedMonth: getCurrentMonth() })
          return
        }
        
        // Ensure end is after start
        if (validatedMonth.end < validatedMonth.start) {
          console.error('End date is before start date, using current month instead')
          set({ selectedMonth: getCurrentMonth() })
          return
        }
        
        console.log('setSelectedMonth called with:', {
          start: format(validatedMonth.start, 'yyyy-MM-dd'),
          end: format(validatedMonth.end, 'yyyy-MM-dd'),
          label: validatedMonth.label
        })
        
        set({ selectedMonth: validatedMonth })
      },
      
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
      version: 2, // Increment version to force clear old corrupt data
      // Migrate function to handle version changes
      migrate: (persistedState, version) => {
        // If version is less than 2, return undefined to reset state
        if (version < 2) {
          console.log('Migrating from version', version, 'to version 2: clearing old data')
          return undefined
        }
        // Otherwise, return the persisted state as is
        return persistedState
      },
      // Custom serialize/deserialize to handle Date objects properly
      // Note: serialize/deserialize are deprecated but still work
      // We'll migrate to storage option in future if needed
      serialize: (state) => {
        // Handle case when state is being cleared (migrate returned undefined)
        if (!state || !state.selectedMonth) {
          return JSON.stringify({})
        }
        
        // Convert Date objects to ISO strings for storage
        const serialized = {
          ...state,
          selectedMonth: {
            start: state.selectedMonth.start instanceof Date 
              ? state.selectedMonth.start.toISOString() 
              : state.selectedMonth.start,
            end: state.selectedMonth.end instanceof Date 
              ? state.selectedMonth.end.toISOString() 
              : state.selectedMonth.end,
            label: state.selectedMonth.label
          }
        }
        return JSON.stringify(serialized)
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str)
        // Convert ISO strings back to Date objects
        if (parsed.selectedMonth) {
          parsed.selectedMonth = {
            start: new Date(parsed.selectedMonth.start),
            end: new Date(parsed.selectedMonth.end),
            label: parsed.selectedMonth.label
          }
        }
        return parsed
      },
      // Force reset to current month on hydration to avoid stale data
      // But only if the stored month is not the current month
      onRehydrateStorage: () => (state) => {
        if (state && state.selectedMonth) {
          const currentMonth = getCurrentMonth()
          
          // Ensure dates are Date objects first, before any comparison
          const storedStart = state.selectedMonth.start instanceof Date 
            ? state.selectedMonth.start 
            : new Date(state.selectedMonth.start)
          const storedEnd = state.selectedMonth.end instanceof Date 
            ? state.selectedMonth.end 
            : new Date(state.selectedMonth.end)
          
          const currentStart = currentMonth.start
          
          // Check if stored month is different from current month
          const storedMonthKey = format(storedStart, 'yyyy-MM')
          const currentMonthKey = format(currentStart, 'yyyy-MM')
          
          // Validate that stored dates are valid
          const storedStartValid = !isNaN(storedStart.getTime())
          const storedEndValid = !isNaN(storedEnd.getTime())
          const storedEndIsAfterStart = storedEnd > storedStart // Must be strictly after, not equal
          const storedEndIsSameAsStart = format(storedStart, 'yyyy-MM-dd') === format(storedEnd, 'yyyy-MM-dd')
          
          console.log('FilterStore hydration:', {
            storedMonth: storedMonthKey,
            currentMonth: currentMonthKey,
            willReset: storedMonthKey !== currentMonthKey,
            storedStart: format(storedStart, 'yyyy-MM-dd'),
            storedEnd: format(storedEnd, 'yyyy-MM-dd'),
            storedStartValid,
            storedEndValid,
            storedEndIsAfterStart,
            storedEndIsSameAsStart
          })
          
          // Reset if month mismatch OR if stored dates are invalid OR if end equals start (corrupt data)
          if (storedMonthKey !== currentMonthKey || !storedStartValid || !storedEndValid || !storedEndIsAfterStart || storedEndIsSameAsStart) {
            console.log('Resetting to current month due to:', {
              monthMismatch: storedMonthKey !== currentMonthKey,
              invalidStart: !storedStartValid,
              invalidEnd: !storedEndValid,
              endBeforeOrEqualStart: !storedEndIsAfterStart,
              endSameAsStart: storedEndIsSameAsStart
            })
            state.selectedMonth = currentMonth
          } else {
            // Ensure dates are Date objects, not strings
            state.selectedMonth.start = storedStart
            state.selectedMonth.end = storedEnd
            
            // Double check after assignment
            console.log('FilterStore after hydration - dates:', {
              start: format(state.selectedMonth.start, 'yyyy-MM-dd'),
              end: format(state.selectedMonth.end, 'yyyy-MM-dd'),
              startIsDate: state.selectedMonth.start instanceof Date,
              endIsDate: state.selectedMonth.end instanceof Date
            })
          }
        } else if (state) {
          // No stored month, set to current
          state.selectedMonth = getCurrentMonth()
        }
      },
    }
  )
)
