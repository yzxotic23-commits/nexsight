'use client'

import { useState, useRef, useEffect } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import { startOfMonth, endOfMonth, format, subMonths, subDays, startOfDay, endOfDay, addMonths, getDaysInMonth, getDay, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'
import { Calendar, DollarSign, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function FilterBar({ showCurrency = false, swapOrder = false }) {
  const { selectedMonth, setSelectedMonth, selectedCurrency, setSelectedCurrency } =
    useFilterStore()
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false)
  const [isCustomDateRangeOpen, setIsCustomDateRangeOpen] = useState(false)
  const [customStartDate, setCustomStartDate] = useState(null)
  const [customEndDate, setCustomEndDate] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 24)) // January 2026
  const [selectingStart, setSelectingStart] = useState(true)
  const monthDropdownRef = useRef(null)
  const currencyDropdownRef = useRef(null)
  const customDateRangeRef = useRef(null)

  // Use consistent reference date (January 24, 2026) instead of system date
  const getReferenceDate = () => {
    return new Date(2026, 0, 24) // January 24, 2026
  }

  // Get current label based on selected month
  const getCurrentLabel = () => {
    const now = getReferenceDate()
    const yesterday = subDays(now, 1)
    const lastMonth = subMonths(now, 1)
    
    // Convert selectedMonth dates to Date objects if they're strings
    const startDate = selectedMonth.start instanceof Date 
      ? selectedMonth.start 
      : new Date(selectedMonth.start)
    const endDate = selectedMonth.end instanceof Date 
      ? selectedMonth.end 
      : new Date(selectedMonth.end)
    
    if (format(startDate, 'yyyy-MM-dd') === format(startOfDay(yesterday), 'yyyy-MM-dd') && 
        format(endDate, 'yyyy-MM-dd') === format(endOfDay(yesterday), 'yyyy-MM-dd')) {
      return 'Yesterday'
    }
    if (format(startDate, 'yyyy-MM-dd') === format(startOfMonth(lastMonth), 'yyyy-MM-dd') && 
        format(endDate, 'yyyy-MM-dd') === format(endOfMonth(lastMonth), 'yyyy-MM-dd')) {
      return 'Last Month'
    }
    if (format(startDate, 'yyyy-MM-dd') === format(startOfMonth(now), 'yyyy-MM-dd') && 
        format(endDate, 'yyyy-MM-dd') === format(endOfMonth(now), 'yyyy-MM-dd')) {
      return 'This Month'
    }
    // Custom date range
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
  }

  const handleDateRangeSelect = (type) => {
    const now = getReferenceDate() // Use consistent reference date
    let start, end, label

    switch (type) {
      case 'yesterday':
        const yesterday = subDays(now, 1)
        start = startOfDay(yesterday)
        end = endOfDay(yesterday)
        label = 'Yesterday'
        break
      case 'lastMonth':
        const lastMonth = subMonths(now, 1)
        start = startOfMonth(lastMonth)
        end = endOfMonth(lastMonth)
        label = 'Last Month'
        break
      case 'thisMonth':
        start = startOfMonth(now)
        end = endOfMonth(now)
        label = 'This Month'
        break
      default:
        return
    }

    setSelectedMonth({ start, end, label })
    setIsMonthDropdownOpen(false)
  }

  const handleCustomDateRangeApply = () => {
    if (customStartDate && customEndDate) {
      const start = startOfDay(customStartDate)
      const end = endOfDay(customEndDate)
      const label = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
      setSelectedMonth({ start, end, label })
      setIsCustomDateRangeOpen(false)
      setIsMonthDropdownOpen(false)
      setCustomStartDate(null)
      setCustomEndDate(null)
      setSelectingStart(true)
    }
  }

  const handleDateClick = (date) => {
    if (selectingStart || !customStartDate) {
      setCustomStartDate(date)
      setCustomEndDate(null)
      setSelectingStart(false)
    } else {
      if (date < customStartDate) {
        setCustomEndDate(customStartDate)
        setCustomStartDate(date)
      } else {
        setCustomEndDate(date)
      }
      setSelectingStart(true)
    }
  }

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfDay(monthStart)
    const endDate = endOfDay(monthEnd)
    
    // Get first day of week (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = getDay(monthStart)
    
    // Create array of days in month
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate })
    
    // Add empty cells for days before month starts
    const emptyDays = Array(firstDayOfWeek).fill(null)
    
    return [...emptyDays, ...daysInMonth]
  }

  const isDateInRange = (date) => {
    if (!customStartDate || !customEndDate) return false
    return date >= customStartDate && date <= customEndDate
  }

  const isDateSelected = (date) => {
    if (customStartDate && isSameDay(date, customStartDate)) return true
    if (customEndDate && isSameDay(date, customEndDate)) return true
    return false
  }

  const isDateStart = (date) => {
    return customStartDate && isSameDay(date, customStartDate)
  }

  const isDateEnd = (date) => {
    return customEndDate && isSameDay(date, customEndDate)
  }

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency)
    setIsCurrencyDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false)
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setIsCurrencyDropdownOpen(false)
      }
      if (customDateRangeRef.current && !customDateRangeRef.current.contains(event.target)) {
        setIsCustomDateRangeOpen(false)
      }
    }
    if (isMonthDropdownOpen || isCurrencyDropdownOpen || isCustomDateRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMonthDropdownOpen, isCurrencyDropdownOpen, isCustomDateRangeOpen])

  const monthButton = (
    <div className="relative" ref={monthDropdownRef}>
      <button
        onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        style={{ backgroundColor: '#DEC05F' }}
      >
        <Calendar className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
        <span className="text-gray-900 dark:text-gray-900">{getCurrentLabel()}</span>
        {isMonthDropdownOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
        )}
      </button>
      {isMonthDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-900 rounded-lg shadow-lg z-10">
          <button
            onClick={() => handleDateRangeSelect('yesterday')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg ${
              getCurrentLabel() === 'Yesterday'
                ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold-400 font-medium'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => handleDateRangeSelect('lastMonth')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              getCurrentLabel() === 'Last Month'
                ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold-400 font-medium'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => handleDateRangeSelect('thisMonth')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors last:rounded-b-lg ${
              getCurrentLabel() === 'This Month'
                ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold-400 font-medium'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            This Month
          </button>
        </div>
      )}
    </div>
  )

  const customDateRangeButton = (
    <div className="relative" ref={customDateRangeRef}>
      <button
        onClick={() => setIsCustomDateRangeOpen(!isCustomDateRangeOpen)}
        className="relative bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-150"
        title="Custom Date Range"
      >
        <Calendar className="h-4 w-4 text-gray-700 dark:text-gray-200" />
      </button>
      
      {/* Custom Date Range Dropdown */}
      {isCustomDateRangeOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-gray-900 z-50">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Custom Date Range</h3>
              <button
                onClick={() => {
                  setIsCustomDateRangeOpen(false)
                  setCustomStartDate(null)
                  setCustomEndDate(null)
                  setSelectingStart(true)
                }}
                className="p-1 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Selected Dates Display */}
            <div className="flex gap-2 text-xs">
              <div className="flex-1 p-2 bg-gray-50 dark:bg-dark-surface rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 mb-1">Start Date</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {customStartDate ? format(customStartDate, 'MMM d, yyyy') : 'Select date'}
                </div>
              </div>
              <div className="flex-1 p-2 bg-gray-50 dark:bg-dark-surface rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 mb-1">End Date</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {customEndDate ? format(customEndDate, 'MMM d, yyyy') : 'Select date'}
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="space-y-2">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />
                  }

                  const inRange = isDateInRange(date)
                  const selected = isDateSelected(date)
                  const isStart = isDateStart(date)
                  const isEnd = isDateEnd(date)
                  const isCurrentMonth = isSameMonth(date, currentMonth)
                  const isToday = isSameDay(date, getReferenceDate())

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateClick(date)}
                      className={`
                        aspect-square text-xs font-medium rounded transition-all
                        ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                        ${inRange && !isStart && !isEnd ? 'bg-gold-100 dark:bg-gold-500/20' : ''}
                        ${isStart ? 'bg-gold-500 text-gray-900 rounded-l-full' : ''}
                        ${isEnd ? 'bg-gold-500 text-gray-900 rounded-r-full' : ''}
                        ${selected && !isStart && !isEnd ? 'bg-gold-500 text-gray-900' : ''}
                        ${!selected && isCurrentMonth ? 'hover:bg-gold-50 dark:hover:bg-gold-500/10' : ''}
                        ${isToday && !selected ? 'ring-2 ring-gold-500 ring-offset-1' : ''}
                      `}
                    >
                      {format(date, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsCustomDateRangeOpen(false)
                  setCustomStartDate(null)
                  setCustomEndDate(null)
                  setSelectingStart(true)
                }}
                className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomDateRangeApply}
                disabled={!customStartDate || !customEndDate}
                className="flex-1 px-3 py-1.5 bg-gold-500 text-gray-900 rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const currencyButton = showCurrency && (
    <div className="relative" ref={currencyDropdownRef}>
      <button
        onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        style={{ backgroundColor: '#DEC05F' }}
      >
        <DollarSign className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
        <span className="text-gray-900 dark:text-gray-900">{selectedCurrency}</span>
        {isCurrencyDropdownOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
        )}
      </button>
      {isCurrencyDropdownOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-900 rounded-lg shadow-lg z-10">
          {['ALL', 'MYR', 'SGD', 'USC'].map((currency) => (
            <button
              key={currency}
              onClick={() => handleCurrencySelect(currency)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                selectedCurrency === currency
                  ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold-400 font-medium'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex items-center gap-3">
      {swapOrder ? (
        <>
          {currencyButton}
          {monthButton}
          {customDateRangeButton}
        </>
      ) : (
        <>
          {monthButton}
          {customDateRangeButton}
          {currencyButton}
        </>
      )}
    </div>
  )
}
