'use client'

import { useEffect, useState, useRef } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useDashboardStore } from '@/lib/stores/dashboardStore'
// Removed mock fallback - using real data only. If no data, set zeros.
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import { format } from 'date-fns'
import KPICard from '@/components/KPICard'
import ChartContainer from '@/components/ChartContainer'
import FilterBar from '@/components/FilterBar'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, LineChart, Line, LabelList } from 'recharts'
import { ArrowUpCircle, ArrowDownCircle, Clock, Search, Bell, HelpCircle, Settings, User, ChevronDown, AlertCircle, DollarSign, AlertTriangle, Power, Activity, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import { useThemeStore } from '@/lib/stores/themeStore'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/toast-context'
import { cachedFetch, clearCache } from '@/lib/hooks/useCachedFetch'

// Custom Tooltip Component - Updated design
const CustomTooltip = ({ active, payload, label }) => {
  const { selectedCurrency, selectedBrand } = useFilterStore()
  if (active && payload && payload.length) {
    const { theme } = useThemeStore.getState()

    // Filter payload to only relevant series based on current selection
    let filtered = payload
    if (selectedCurrency && selectedCurrency !== 'ALL') {
      if (selectedCurrency === 'SGD') {
        if (selectedBrand && selectedBrand !== 'ALL') {
          filtered = payload.filter(p => p.name === selectedBrand)
        } else {
          // SGD + ALL => show only SGD aggregate series
          filtered = payload.filter(p => p.name === 'SGD' || p.dataKey?.startsWith('sgd_'))
        }
      } else {
        // MYR or USC selected -> show only that market
        filtered = payload.filter(p => p.name === selectedCurrency || p.dataKey?.startsWith(selectedCurrency.toLowerCase() + '_'))
      }
    }

    // If after filtering nothing remains, fallback to non-zero values
    if (!filtered || filtered.length === 0) {
      filtered = payload.filter(p => Number(p.value) && Number(p.value) !== 0)
    }

    if (filtered.length > 1) {
      const markets = filtered.map((p) => {
        const marketColors = {
          'MYR': '#DEC05F',
          'SGD': theme === 'dark' ? '#C0C0C0' : '#1f2937',
          'USC': '#3b82f6'
        }
        const brandColors = {
          'WBSG': '#DEC05F',
          'M24SG': '#f97316',
          'OK188SG': '#60a5fa',
          'OXSG': '#14b8a6',
          'FWSG': theme === 'dark' ? '#ffffff' : '#1f2937',
          'ABSG': '#a78bfa'
        }
        const color = marketColors[p.name] || brandColors[p.name] || p.color || '#DEC05F'
        return {
          name: p.name,
          value: p.value || 0,
          color
        }
      })

      const total = markets.reduce((sum, m) => sum + (m.value || 0), 0)

      return (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700 min-w-[200px]">
          <p className="text-gray-900 dark:text-white text-sm font-bold mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            {label}
          </p>
          <div className="space-y-2">
            {markets.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {typeof entry.value === 'number' ? entry.value.toFixed(entry.value < 1 ? 2 : 0) : entry.value}
                </span>
              </div>
            ))}
            {total > 0 && (
              <div className="pt-2 mt-2 border-t-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{total.toFixed(total < 1 ? 2 : 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Single value tooltip
    const p = filtered[0]
    const value = p?.value || 0
    const color = p?.color || '#DEC05F'
    const name = p?.name || (p?.dataKey || '')
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white text-sm font-bold mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: color }}></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{name}:</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toFixed(value < 1 ? 2 : 0) : value}
          </span>
        </div>
      </div>
    )
  }
  return null
}

// Custom Tooltip Component for Bar Chart
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const filledValue = payload.find((p) => p.dataKey === 'filled')?.value || 0
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white text-sm font-bold mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: payload[0].color || '#DEC05F' }}></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{payload[0].name || 'Value'}:</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
          {filledValue} transactions
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function WithdrawMonitorPage() {
  const { showToast } = useToast()
  const { user: session } = useAuth()
  const { selectedMonth, selectedCurrency } = useFilterStore()
  const { withdrawData, setWithdrawData } = useDashboardStore()
  const { theme } = useThemeStore()
  const [activeTab, setActiveTab] = useState('Overview')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('ALL')
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)
  const brandDropdownRef = useRef(null)
  const [brands, setBrands] = useState(['ALL'])
  const [isLoadingBrands, setIsLoadingBrands] = useState(false)
  const prevCurrencyRef = useRef(selectedCurrency)

  // Reset brand to ALL when user switches market (currency)
  useEffect(() => {
    if (prevCurrencyRef.current && prevCurrencyRef.current !== selectedCurrency) {
      setSelectedBrand('ALL')
    }
    prevCurrencyRef.current = selectedCurrency
  }, [selectedCurrency])
  
  // Pagination for Slow Transaction table
  const [slowPageSize, setSlowPageSize] = useState(20)
  const [slowPage, setSlowPage] = useState(1)
  // Sort for Slow Transaction table - column and direction
  const [slowSortColumn, setSlowSortColumn] = useState(null) // 'brand', 'customerName', 'amount', 'processingTime', 'date'
  const [slowSortDirection, setSlowSortDirection] = useState('asc') // 'asc' or 'desc'

  // Fetch brands from Supabase brand-market-mapping for the selected currency
  useEffect(() => {
    async function fetchBrandsFromSupabase() {
      if (!selectedCurrency || selectedCurrency === 'ALL') {
        setBrands(['ALL'])
        return
      }
      setIsLoadingBrands(true)
      try {
        const json = await cachedFetch('/api/settings/brand-market-mapping', {}, 10 * 60 * 1000) // 10 minutes cache for brand mapping
        if (json.success) {
          const filtered = json.data
            .filter(item => item.market === selectedCurrency && item.status === 'Active')
            .map(item => item.brand)
          if (filtered.length > 0) {
            setBrands(['ALL', ...filtered])
          } else {
            // fallback 1: try using withdrawData.brandComparison already loaded in store
            const bcFromStore = (withdrawData?.brandComparison || []).map(b => b.brand).filter(Boolean)
            if (bcFromStore.length > 0) {
              setBrands(['ALL', ...bcFromStore])
            } else {
              // fallback 2: try to fetch withdraw data brand list for this currency & date range
              try {
                const startDate = format(selectedMonth.start, 'yyyy-MM-dd')
                const endDate = format(selectedMonth.end, 'yyyy-MM-dd')
                const jd = await cachedFetch(`/api/withdraw/data?startDate=${startDate}&endDate=${endDate}&currency=${selectedCurrency}&brand=ALL`, {}, 30 * 1000, true)
                const bc = (jd?.data?.brandComparison || []).map(b => b.brand).filter(Boolean)
                if (bc.length > 0) {
                  setBrands(['ALL', ...bc])
                } else {
                  // final fallback list
                  if (selectedCurrency === 'SGD') {
                    setBrands(['ALL', 'WBSG', 'M24SG', 'OK188SG', 'OXSG', 'FWSG', 'ABSG'])
                  } else {
                    setBrands(['ALL'])
                  }
                }
              } catch (e) {
                if (selectedCurrency === 'SGD') {
                  setBrands(['ALL', 'WBSG', 'M24SG', 'OK188SG', 'OXSG', 'FWSG', 'ABSG'])
                } else {
                  setBrands(['ALL'])
                }
              }
            }
          }
        } else {
          // fallback to default list per market
          if (selectedCurrency === 'SGD') {
            setBrands(['ALL', 'WBSG', 'M24SG', 'OK188SG', 'OXSG', 'FWSG', 'ABSG'])
          } else if (selectedCurrency === 'MYR') {
            setBrands(['ALL']) // add specific MYR brands if available
          } else if (selectedCurrency === 'USC') {
            setBrands(['ALL']) // add USC brands if available
          } else {
            setBrands(['ALL'])
          }
        }
      } catch (e) {
        console.error('Error fetching brands for withdraw:', e)
        if (selectedCurrency === 'SGD') {
          setBrands(['ALL', 'WBSG', 'M24SG', 'OK188SG', 'OXSG', 'FWSG', 'ABSG'])
        } else {
          setBrands(['ALL'])
        }
      } finally {
        setIsLoadingBrands(false)
      }
    }
    fetchBrandsFromSupabase()
  }, [selectedCurrency, selectedMonth, withdrawData])

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setIsBrandDropdownOpen(false)
      }
    }
    if (isUserDropdownOpen || isBrandDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen, isBrandDropdownOpen])

  useEffect(() => {
    async function fetchWithdrawData() {

      // Format date as YYYY-MM-DD using date-fns format to avoid timezone issues
      const formatLocalDate = (date) => {
        const dateObj = date instanceof Date ? date : new Date(date)
        // Use date-fns format to ensure consistent date formatting without timezone issues
        const formatted = format(dateObj, 'yyyy-MM-dd')
        return formatted
      }

      // Ensure dates are Date objects
      const startDateObj = selectedMonth.start instanceof Date 
        ? selectedMonth.start 
        : new Date(selectedMonth.start)
      const endDateObj = selectedMonth.end instanceof Date 
        ? selectedMonth.end 
        : new Date(selectedMonth.end)

      const startDate = formatLocalDate(startDateObj)
      const endDate = formatLocalDate(endDateObj)

      // Debug: Log date range being sent to API with detailed info
      console.log('Withdraw Monitor - Date range:', {
        startDate,
        endDate,
        startDateObj: startDateObj.toISOString(),
        endDateObj: endDateObj.toISOString(),
        startDateLocal: format(startDateObj, 'yyyy-MM-dd HH:mm:ss'),
        endDateLocal: format(endDateObj, 'yyyy-MM-dd HH:mm:ss'),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        selectedMonth: selectedMonth
      })

      // Clear cache for withdraw data when date range changes to ensure fresh data
      clearCache('/api/withdraw/data')

      try {
        if (selectedCurrency === 'ALL') {
          const markets = ['MYR', 'SGD', 'USC']
          const promises = markets.map(m =>
            cachedFetch(`/api/withdraw/data?startDate=${startDate}&endDate=${endDate}&currency=${m}&brand=ALL`, {}, 30 * 1000, true).catch(() => null)
          )
          const results = await Promise.all(promises)
          const dataByMarket = {}
          markets.forEach((m, i) => {
            const res = results[i]
            dataByMarket[m] = (res && res.success && res.data) ? res.data : { totalTransaction: 0, avgProcessingTime: 0, dailyData: [], chartData: {}, slowTransactions: [], brandComparison: [] }
          })

          const totalCount = Object.values(dataByMarket).reduce((s, d) => s + (d.totalTransaction || 0), 0)
          const weightedSum = Object.values(dataByMarket).reduce((s, d) => s + ((d.avgProcessingTime || 0) * (d.totalTransaction || 0)), 0)
          const avgPTime = totalCount > 0 ? (weightedSum / totalCount) : 0

          const dateMap = {}
          Object.values(dataByMarket).forEach(d => {
            (d.dailyData || []).forEach(item => {
              const key = item.date
              if (!dateMap[key]) dateMap[key] = { date: key, count: 0, amount: 0 }
              dateMap[key].count += item.count || 0
              dateMap[key].amount += item.amount || 0
            })
          })
          const combinedDaily = Object.values(dateMap).sort((a,b) => new Date(a.date) - new Date(b.date))

          const combinedChart = { overdueTrans: {}, avgProcessingTime: {}, transactionVolume: {}, myr_overdueTrans: {}, sgd_overdueTrans: {}, usc_overdueTrans: {}, myr_avgProcessingTime: {}, sgd_avgProcessingTime: {}, usc_avgProcessingTime: {}, myr_transactionVolume: {}, sgd_transactionVolume: {}, usc_transactionVolume: {} }
          Object.entries(dataByMarket).forEach(([m, d]) => {
            const keyPrefix = m.toLowerCase()
            const c = d.chartData || {}
            const overdue = c.overdueTrans || {}
            const avg = c.avgProcessingTime || {}
            const vol = c.transactionVolume || {}
            Object.keys({...overdue, ...avg, ...vol}).forEach(dateKey => {
              const prefOver = `${keyPrefix}_overdueTrans`
              const prefAvg = `${keyPrefix}_avgProcessingTime`
              const prefVol = `${keyPrefix}_transactionVolume`
              combinedChart[prefOver][dateKey] = overdue[dateKey] || 0
              combinedChart[prefAvg][dateKey] = avg[dateKey] || 0
              combinedChart[prefVol][dateKey] = vol[dateKey] || 0
              combinedChart.overdueTrans[dateKey] = (combinedChart.overdueTrans[dateKey] || 0) + (overdue[dateKey] || 0)
              const existingAvg = combinedChart.avgProcessingTime[dateKey] || { sum: 0, weight: 0 }
              const weight = vol[dateKey] || 0
              existingAvg.sum = (existingAvg.sum || 0) + ((avg[dateKey] || 0) * weight)
              existingAvg.weight = (existingAvg.weight || 0) + weight
              combinedChart.avgProcessingTime[dateKey] = existingAvg
              combinedChart.transactionVolume[dateKey] = (combinedChart.transactionVolume[dateKey] || 0) + (vol[dateKey] || 0)
            })
          })
          Object.keys(combinedChart.avgProcessingTime).forEach(k => {
            const obj = combinedChart.avgProcessingTime[k]
            combinedChart.avgProcessingTime[k] = obj.weight > 0 ? (obj.sum / obj.weight) : 0
          })

          const combinedBrandComp = [].concat(...Object.values(dataByMarket).map(d => d.brandComparison || []))
          const combinedSlow = [].concat(...Object.values(dataByMarket).map(d => d.slowTransactions || []))

          const mapped = {
            month: format(selectedMonth.start, 'MMMM yyyy'),
            currency: 'ALL',
            currencySymbol: '',
            totalCount,
            totalAmount: combinedDaily.reduce((s,r)=>s+(r.amount||0),0),
            avgAmount: 0,
            avgProcessingTime: avgPTime,
            dailyData: combinedDaily,
            chartData: combinedChart,
            slowTransactions: combinedSlow,
            slowTransactionSummary: { totalSlowTransaction: combinedSlow.length, avgProcessingTime: combinedSlow.length ? (combinedSlow.reduce((s,d)=>s+(d.processingTime||0),0)/combinedSlow.length) : 0, brand: 'N/A' },
            brandComparison: combinedBrandComp
          }
          setWithdrawData(mapped)
        } else {
          const result = await cachedFetch(`/api/withdraw/data?startDate=${startDate}&endDate=${endDate}&currency=${selectedCurrency}&brand=${selectedBrand}`, {}, 30 * 1000, true)
          if (result.success && result.data) {
            const d = result.data
            const mapped = {
              month: format(selectedMonth.start, 'MMMM yyyy'),
              currency: selectedCurrency,
              currencySymbol: selectedCurrency === 'MYR' ? 'RM' : selectedCurrency === 'SGD' ? 'S$' : 'US$',
              totalCount: d.totalTransaction || 0,
              totalAmount: d.dailyData ? d.dailyData.reduce((s, r) => s + (r.amount || 0), 0) : 0,
              avgAmount: 0,
              avgProcessingTime: d.avgProcessingTime || 0,
              dailyData: (d.dailyData || []).map(day => ({ date: day.date, count: day.count || 0, amount: day.amount || 0 })),
              chartData: d.chartData || {},
              slowTransactions: d.slowTransactions || [],
              slowTransactionSummary: d.slowTransactionSummary || { totalSlowTransaction: 0, avgProcessingTime: 0, brand: 'N/A' },
              brandComparison: d.brandComparison || []
            }
            setWithdrawData(mapped)
          } else {
            // No data returned - initialize zeros
            setWithdrawData({
              month: format(selectedMonth.start, 'MMMM yyyy'),
              currency: selectedCurrency,
              currencySymbol: selectedCurrency === 'MYR' ? 'RM' : selectedCurrency === 'SGD' ? 'S$' : 'US$',
              totalCount: 0,
              totalAmount: 0,
              avgAmount: 0,
              avgProcessingTime: 0,
              dailyData: [],
              chartData: { overdueTrans: {}, avgProcessingTime: {}, transactionVolume: {} },
              slowTransactions: [],
              slowTransactionSummary: { totalSlowTransaction: 0, avgProcessingTime: 0, brand: 'N/A' },
              brandComparison: []
            })
          }
        }
      } catch (error) {
        console.error('Error fetching withdraw data:', error)
        // On error, initialize zeros
        setWithdrawData({
          month: format(selectedMonth.start, 'MMMM yyyy'),
          currency: selectedCurrency,
          currencySymbol: selectedCurrency === 'MYR' ? 'RM' : selectedCurrency === 'SGD' ? 'S$' : 'US$',
          totalCount: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgProcessingTime: 0,
          dailyData: [],
          chartData: { overdueTrans: {}, avgProcessingTime: {}, transactionVolume: {} },
          slowTransactions: [],
          slowTransactionSummary: { totalSlowTransaction: 0, avgProcessingTime: 0, brand: 'N/A' },
          brandComparison: []
        })
      }
    }

    fetchWithdrawData()
  }, [selectedMonth, selectedCurrency, selectedBrand, setWithdrawData])

  if (!withdrawData) {
    return <div>Loading...</div>
  }

  // Prepare chart data - daily breakdown (all 0 since no data in Supabase)
  const dailyChartData = withdrawData.dailyData.map((day) => {
    return {
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0,
      amount: 0,
      filled: 0,
      remaining: 0,
      isHighlighted: false,
    }
  })

  const tabs = ['Overview', 'Brand Comparison', 'Slow Transaction', 'Case Volume']

  const availableBrands = brands
  
  // Calculate KPI data based on selected currency and brand
  const calculateOverviewData = () => {
    const totalTransaction = withdrawData?.totalCount || 0
    const avgPTime = withdrawData?.avgProcessingTime || 0
    // If withdrawData provides slow/overdue list use its length, otherwise fallback to 0
    const transOver5m = Array.isArray(withdrawData?.slowTransactions)
      ? withdrawData.slowTransactions.length
      : (withdrawData?.transOver5m || 0)

    return {
      totalTransaction,
      avgPTimeAutomation: avgPTime,
      transOver5m
    }
  }

  const overviewData = calculateOverviewData()

  // Color for SGD based on theme
  const sgdColor = theme === 'dark' ? '#C0C0C0' : '#1f2937' // Silver for dark mode, black for light mode

  // Brand colors - using theme colors (gold, gray, blue variations)
  // FWSG uses white in dark mode, dark gray in light mode
  const brandColors = {
    'WBSG': '#DEC05F',      // Gold
    'M24SG': '#f97316',     // Orange
    'OK188SG': '#60a5fa',   // Light Blue
    'OXSG': '#14b8a6',      // Teal
    'FWSG': theme === 'dark' ? '#ffffff' : '#1f2937',  // White in dark mode, Dark Gray in light mode
    'ABSG': '#a78bfa'       // Purple
  }

  // Helper to format processing time (seconds) to human readable (e.g., 2m 05s or 12.3s)
  const formatProcessingTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '0.0s'
    const sec = Number(seconds) || 0
    if (sec >= 60) {
      const m = Math.floor(sec / 60)
      const s = Math.round(sec % 60)
      return `${m}m ${s.toString().padStart(2, '0')}s`
    }
    return `${sec.toFixed(1)}s`
  }

  // Chart data following date range - build from API response (withdrawData.chartData) if available
  const chartData = (withdrawData.dailyData || []).map((day) => {
    const dateKey = day.date
    const formatted = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const baseData = {
      date: formatted,
      originalDate: dateKey,
    }

    // Fill aggregate values from chartData if present
    const c = withdrawData.chartData || {}
    if (selectedCurrency === 'ALL') {
      baseData.myr_overdueTrans = c.myr_overdueTrans?.[dateKey] || 0
      baseData.sgd_overdueTrans = c.sgd_overdueTrans?.[dateKey] || 0
      baseData.usc_overdueTrans = c.usc_overdueTrans?.[dateKey] || 0
      baseData.overdueTrans = (baseData.myr_overdueTrans || 0) + (baseData.sgd_overdueTrans || 0) + (baseData.usc_overdueTrans || 0)

      baseData.myr_avgProcessingTime = c.myr_avgProcessingTime?.[dateKey] || 0
      baseData.sgd_avgProcessingTime = c.sgd_avgProcessingTime?.[dateKey] || 0
      baseData.usc_avgProcessingTime = c.usc_avgProcessingTime?.[dateKey] || 0
      // aggregate avgProcessingTime as weighted by transactionVolume per date if available, else simple average
      const volMy = c.myr_transactionVolume?.[dateKey] || 0
      const volSg = c.sgd_transactionVolume?.[dateKey] || 0
      const volUs = c.usc_transactionVolume?.[dateKey] || 0
      const totalVol = volMy + volSg + volUs
      if (totalVol > 0) {
        baseData.avgProcessingTime = ((baseData.myr_avgProcessingTime * volMy) + (baseData.sgd_avgProcessingTime * volSg) + (baseData.usc_avgProcessingTime * volUs)) / totalVol
      } else {
        baseData.avgProcessingTime = 0
      }

      baseData.myr_transactionVolume = c.myr_transactionVolume?.[dateKey] || 0
      baseData.sgd_transactionVolume = c.sgd_transactionVolume?.[dateKey] || 0
      baseData.usc_transactionVolume = c.usc_transactionVolume?.[dateKey] || 0
      baseData.transactionVolume = (baseData.myr_transactionVolume || 0) + (baseData.sgd_transactionVolume || 0) + (baseData.usc_transactionVolume || 0)
    } else {
      baseData.overdueTrans = c.overdueTrans?.[dateKey] || 0
      baseData.avgProcessingTime = c.avgProcessingTime?.[dateKey] || 0
      baseData.transactionVolume = c.transactionVolume?.[dateKey] || 0

      // Market / brand fields
      // If single currency selected, map into that currency prefix
      const prefix = selectedCurrency ? selectedCurrency.toLowerCase() : 'sgd'
      baseData[`${prefix}_overdueTrans`] = baseData.overdueTrans
      baseData[`${prefix}_avgProcessingTime`] = baseData.avgProcessingTime
      baseData[`${prefix}_transactionVolume`] = baseData.transactionVolume
    }

    // If a specific brand is selected for any single-market view, map to brand_<metric>
    if (selectedBrand && selectedBrand !== 'ALL') {
      baseData[`${selectedBrand}_overdueTrans`] = baseData.overdueTrans
      baseData[`${selectedBrand}_avgProcessingTime`] = baseData.avgProcessingTime
      baseData[`${selectedBrand}_transactionVolume`] = baseData.transactionVolume
    } else if (selectedCurrency === 'SGD') {
      // when SGD ALL, also provide per-brand fields if withdrawData provides brand breakdown (not implemented server-side)
      brands.slice(1).forEach((brand) => {
        baseData[`${brand}_overdueTrans`] = baseData[`${brand}_overdueTrans`] || 0
        baseData[`${brand}_avgProcessingTime`] = baseData[`${brand}_avgProcessingTime`] || 0
        baseData[`${brand}_transactionVolume`] = baseData[`${brand}_transactionVolume`] || 0
      })
    }

    // Ensure MYR/USC fields exist to avoid undefined in charts for ALL view
    if (!baseData.myr_overdueTrans) baseData.myr_overdueTrans = 0
    if (!baseData.myr_avgProcessingTime) baseData.myr_avgProcessingTime = 0
    if (!baseData.myr_transactionVolume) baseData.myr_transactionVolume = 0
    if (!baseData.sgd_overdueTrans) baseData.sgd_overdueTrans = 0
    if (!baseData.sgd_avgProcessingTime) baseData.sgd_avgProcessingTime = 0
    if (!baseData.sgd_transactionVolume) baseData.sgd_transactionVolume = 0
    if (!baseData.usc_overdueTrans) baseData.usc_overdueTrans = 0
    if (!baseData.usc_avgProcessingTime) baseData.usc_avgProcessingTime = 0
    if (!baseData.usc_transactionVolume) baseData.usc_transactionVolume = 0

    return baseData
  })

  // Debug logs to help diagnose empty charts (local only)
  try {
    // eslint-disable-next-line no-console
    console.log('Withdraw page - withdrawData snapshot:', {
      totalCount: withdrawData?.totalCount,
      avgProcessingTime: withdrawData?.avgProcessingTime,
      dailyDataLength: (withdrawData?.dailyData || []).length,
      hasChartData: !!withdrawData?.chartData,
      chartKeys: withdrawData?.chartData ? Object.keys(withdrawData.chartData) : []
    })
    // eslint-disable-next-line no-console
    console.log('Withdraw page - generated chartData sample:', chartData.slice(0, 3))
  } catch (e) {
    // ignore
  }

  // Slow Transaction Data (Processing time > 5 minutes = 300 seconds)
  const slowTransactionData = (() => {
    let details = Array.isArray(withdrawData?.slowTransactions) ? withdrawData.slowTransactions : []
    // filter by brand if selected
    if (selectedBrand && selectedBrand !== 'ALL') {
      details = details.filter(d => (d.brand || '').toString() === selectedBrand)
    }
    const total = details.length
    const avg = total > 0 ? Math.round((details.reduce((s,d) => s + (Number(d.processingTime)||0), 0) / total) * 10) / 10 : 0
    const topBrand = details.length > 0 ? details[0].brand : 'N/A'
    return {
      totalSlowTransaction: total,
      avgProcessingTime: avg,
      brand: topBrand,
      details
    }
  })()

  // Case Volume Data - show per selected market (MYR/SGD/USC). Empty for ALL.
  const caseVolumeData = (() => {
    const raw = withdrawData.brandComparison || []
    if (!selectedCurrency || selectedCurrency === 'ALL') return []
    const marketBrands = availableBrands.filter(b => b !== 'ALL')
    let items = []
    if (marketBrands.length > 0) {
      items = marketBrands.map((brand) => {
        const found = raw.find(r => r.brand === brand) || {}
        const totalTransaction = Number(found.totalTransaction || found.total_transaction || found.totalTrans || found.transactionCount || found.count || found.transactions || found.total || found.txn_count || found.txnCount || 0)
        // if a specific brand is selected, return only that brand's entry
        if (selectedBrand && selectedBrand !== 'ALL') {
          if (brand !== selectedBrand) return null
        }
        return {
          brand,
          cases: totalTransaction,
          totalOverdue: Number(found.totalSlowTransaction || found.totalOverdue || found.count || 0),
          color: brandColors[brand] || (selectedCurrency === 'SGD' ? sgdColor : selectedCurrency === 'MYR' ? '#DEC05F' : '#3b82f6')
        }
      })
      // filter out nulls if selectedBrand used
      items = items.filter(Boolean)
    } else {
      // fallback: map all raw entries
      items = raw.map((r) => {
        const totalTransaction = Number(r.totalTransaction || r.total_transaction || r.totalTrans || r.transactionCount || r.count || r.transactions || r.total || r.txn_count || r.txnCount || 0)
        // if a specific brand selected, only include it
        if (selectedBrand && selectedBrand !== 'ALL') {
          if ((r.brand || '') !== selectedBrand) return null
        }
        return {
          brand: r.brand || 'Unknown',
          cases: totalTransaction,
          totalOverdue: Number(r.totalSlowTransaction || r.totalOverdue || r.count || 0),
          color: brandColors[r.brand] || (selectedCurrency === 'SGD' ? sgdColor : selectedCurrency === 'MYR' ? '#DEC05F' : '#3b82f6')
        }
      }).filter(Boolean)
    }
    return items
  })()


  // Custom Tooltip for Case Volume
  const CaseVolumeTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const cases = data.cases || 0
      
      return (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700">
          <p className="text-gray-900 dark:text-white text-sm font-bold mb-2">{data.brand}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: payload[0].color || '#DEC05F' }}></div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Cases:</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">{cases.toFixed(2)}</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Brand Comparison Data - show per selected market (MYR/SGD/USC). Empty for ALL.
  const brandComparisonData = (() => {
    const raw = withdrawData.brandComparison || []
    if (!selectedCurrency || selectedCurrency === 'ALL') return []
    const marketBrands = availableBrands.filter(b => b !== 'ALL')
    let filtered = []
    if (marketBrands.length > 0) {
      filtered = raw.filter(item => marketBrands.includes(item.brand))
    } else {
      // fallback: include all raw entries if mapping not available
      filtered = raw
    }
    // if a specific brand selected, narrow down to it
    if (selectedBrand && selectedBrand !== 'ALL') {
      filtered = filtered.filter(item => (item.brand || '').toString() === selectedBrand)
    }
    return filtered.map((item) => {
      const brand = item.brand || 'Unknown'
      const avgTime = item.avgProcessingTime ?? item.avgTime ?? item.avg_time ?? 0
      const totalOverdue = item.totalSlowTransaction ?? item.totalOverdue ?? item.count ?? 0
      return {
        brand,
        avgTime: Number(avgTime) || 0,
        totalOverdue: Number(totalOverdue) || 0,
        color: brandColors[brand] || (selectedCurrency === 'SGD' ? sgdColor : selectedCurrency === 'MYR' ? '#DEC05F' : '#3b82f6')
      }
    })
  })()

  // Custom Tooltip for Brand Comparison
  const BrandComparisonTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const avgTime = data.avgTime || 0
      const status = data.status || 'Unknown'
      
      return (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700">
          <p className="text-gray-900 dark:text-white text-sm font-bold mb-2">{data.brand}</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: payload[0].color || '#DEC05F' }}></div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Avg Time:</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">{avgTime.toFixed(0)}s</span>
            </div>
            <div className="pt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Status: {status}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
        {/* Tabs and Filter Bar - Tabs center, MYR and Month right */}
      <div className="mb-6">
        <div className="flex items-center justify-between mt-4 relative">
          {/* Tabs - Center (absolute positioned) */}
          <nav className="absolute left-1/2 transform -translate-x-1/2 inline-flex bg-white dark:bg-dark-card p-1 rounded-full" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gold-500 text-gray-900 dark:text-gray-900 shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          
          {/* Filter Bar - Right (Brand then Market then Month) */}
          <div className="ml-auto flex items-center gap-3">
            {/* Brand Dropdown Filter - show for any single market (MYR/SGD/USC) on all tabs */}
            {selectedCurrency && selectedCurrency !== 'ALL' ? (
              <div className="relative" ref={brandDropdownRef}>
                <button
                  onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  style={{ backgroundColor: '#DEC05F' }}
                >
                  <span className="text-gray-900 dark:text-gray-900">{selectedBrand}</span>
                  {isBrandDropdownOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900 rotate-180 transition-transform" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900 transition-transform" />
                  )}
                </button>
                {isBrandDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-900 rounded-lg shadow-lg z-50">
                    {availableBrands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => {
                          setSelectedBrand(brand)
                          setIsBrandDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          selectedBrand === brand
                            ? 'bg-gold-100 dark:bg-gold-500/20 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        } ${brand === availableBrands[0] ? 'rounded-t-lg' : ''} ${brand === availableBrands[availableBrands.length - 1] ? 'rounded-b-lg' : ''}`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" style={{ width: '120px', height: '32px' }}></div>
            )}
            <FilterBar showCurrency={true} swapOrder={true} />
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard
              title="Total Transaction"
              value={formatNumber(overviewData.totalTransaction)}
              change={0}
              icon={Activity}
              trend="neutral"
            />
            <KPICard
              title="Avg Processing Time"
              value={formatProcessingTime(overviewData.avgPTimeAutomation)}
              change={0}
              icon={Clock}
              trend="neutral"
            />
            <KPICard
              title="Trans > 5m"
              value={formatNumber(overviewData.transOver5m)}
              change={0}
              icon={AlertCircle}
              trend="neutral"
              iconColor="text-red-500"
              iconBg="bg-red-100 dark:bg-red-900/20"
            />
          </div>

          {/* Charts - Follow Date Range */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer title="Overdue Transaction">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    {brands.slice(1).map((brand) => (
                      <linearGradient key={brand} id={`color${brand}Withdraw`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={brandColors[brand]} stopOpacity={0.4} />
                        <stop offset="50%" stopColor={brandColors[brand]} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={brandColors[brand]} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                    <linearGradient id="colorMYROverdueWithdraw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DEC05F" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#DEC05F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#DEC05F" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorSGDOverdueWithdraw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sgdColor} stopOpacity={0.4} />
                      <stop offset="50%" stopColor={sgdColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={sgdColor} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorUSCOverdueWithdraw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    axisLine={{ strokeWidth: 0.5 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    axisLine={{ strokeWidth: 0.5 }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  {selectedCurrency === 'ALL' && (
                    <Legend 
                      verticalAlign="top" 
                      align="left" 
                      wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', marginTop: '-10px', fontSize: '14px' }} 
                      iconType="circle" 
                      iconSize={8}
                      fontSize={14}
                    />
                  )}
                  {selectedCurrency === 'ALL' ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="myr_overdueTrans"
                        stroke="#DEC05F"
                        fill="url(#colorMYROverdueWithdraw)"
                        name="MYR"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={600}
                      />
                      <Area
                        type="monotone"
                        dataKey="sgd_overdueTrans"
                        stroke={sgdColor}
                        fill="url(#colorSGDOverdueWithdraw)"
                        name="SGD"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={600}
                      />
                      <Area
                        type="monotone"
                        dataKey="usc_overdueTrans"
                        stroke="#3b82f6"
                        fill="url(#colorUSCOverdueWithdraw)"
                        name="USC"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={600}
                      />
                    </>
                  ) : selectedCurrency === 'MYR' ? (
                    selectedBrand && selectedBrand !== 'ALL' ? (
                      <Area
                        type="monotone"
                        dataKey={`${selectedBrand}_overdueTrans`}
                        stroke={brandColors[selectedBrand] || '#DEC05F'}
                        fill={`url(#color${selectedBrand}Withdraw)`}
                        name={selectedBrand}
                        strokeWidth={2}
                        dot={false}
                      />
                    ) : (
                      <Area
                        type="monotone"
                        dataKey="myr_overdueTrans"
                        stroke="#DEC05F"
                        fill="url(#colorMYROverdueWithdraw)"
                        name="MYR"
                        strokeWidth={2}
                        dot={false}
                      />
                    )
                  ) : selectedCurrency === 'SGD' ? (
                    selectedBrand !== 'ALL' ? (
                      <Area
                        type="monotone"
                        dataKey={`${selectedBrand}_overdueTrans`}
                        stroke={brandColors[selectedBrand]}
                        fill={`url(#color${selectedBrand}Withdraw)`}
                        name={selectedBrand}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={600}
                      />
                    ) : (
                      <Area
                        type="monotone"
                        dataKey="sgd_overdueTrans"
                        stroke={sgdColor}
                        fill="url(#colorSGDOverdueWithdraw)"
                        name="SGD"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={600}
                      />
                    )
                  ) : selectedCurrency === 'USC' ? (
                    selectedBrand && selectedBrand !== 'ALL' ? (
                      <Area
                        type="monotone"
                        dataKey={`${selectedBrand}_overdueTrans`}
                        stroke={brandColors[selectedBrand] || '#3b82f6'}
                        fill={`url(#color${selectedBrand}Withdraw)`}
                        name={selectedBrand}
                        strokeWidth={2}
                        dot={false}
                      />
                    ) : (
                      <Area
                        type="monotone"
                        dataKey="usc_overdueTrans"
                        stroke="#3b82f6"
                        fill="url(#colorUSCOverdueWithdraw)"
                        name="USC"
                        strokeWidth={2}
                        dot={false}
                      />
                    )
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Average Processing Time">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    axisLine={{ strokeWidth: 0.5 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    axisLine={{ strokeWidth: 0.5 }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  {selectedCurrency === 'ALL' && (
                    <Legend 
                      verticalAlign="top" 
                      align="left" 
                      wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', marginTop: '-10px', fontSize: '14px' }} 
                      iconType="circle" 
                      iconSize={8}
                      fontSize={14}
                    />
                  )}
                  {selectedCurrency === 'ALL' ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="myr_avgProcessingTime"
                        stroke="#DEC05F"
                        strokeWidth={2}
                        name="MYR"
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={600}
                      />
                      <Line
                        type="monotone"
                        dataKey="sgd_avgProcessingTime"
                        stroke={sgdColor}
                        strokeWidth={2}
                        name="SGD"
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={600}
                      />
                      <Line
                        type="monotone"
                        dataKey="usc_avgProcessingTime"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="USC"
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={600}
                      />
                    </>
                  ) : selectedCurrency === 'MYR' ? (
                    selectedBrand && selectedBrand !== 'ALL' ? (
                      <Line
                        type="monotone"
                        dataKey={`${selectedBrand}_avgProcessingTime`}
                        stroke={brandColors[selectedBrand] || '#DEC05F'}
                        strokeWidth={2}
                        name={selectedBrand}
                        dot={false}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="myr_avgProcessingTime"
                        stroke="#DEC05F"
                        strokeWidth={2}
                        name="MYR"
                        dot={false}
                      />
                    )
                  ) : selectedCurrency === 'SGD' ? (
                    selectedBrand !== 'ALL' ? (
                      <Line
                        type="monotone"
                        dataKey={`${selectedBrand}_avgProcessingTime`}
                        stroke={brandColors[selectedBrand]}
                        strokeWidth={2}
                        name={selectedBrand}
                        dot={false}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="sgd_avgProcessingTime"
                        stroke={sgdColor}
                        strokeWidth={2}
                        name="SGD"
                        dot={false}
                      />
                    )
                  ) : selectedCurrency === 'USC' ? (
                    selectedBrand && selectedBrand !== 'ALL' ? (
                      <Line
                        type="monotone"
                        dataKey={`${selectedBrand}_avgProcessingTime`}
                        stroke={brandColors[selectedBrand] || '#3b82f6'}
                        strokeWidth={2}
                        name={selectedBrand}
                        dot={false}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="usc_avgProcessingTime"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="USC"
                        dot={false}
                      />
                    )
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Transaction Volume Trend Analysis - Full Width */}
          <ChartContainer title="Transaction Volume Trend Analysis">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  axisLine={{ strokeWidth: 0.5 }} 
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6b7280" 
                  axisLine={{ strokeWidth: 0.5 }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                {selectedCurrency === 'ALL' && (
                  <Legend 
                    verticalAlign="top" 
                    align="left" 
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', marginTop: '-10px', fontSize: '14px' }} 
                    iconType="circle" 
                    iconSize={8}
                    fontSize={14}
                  />
                )}
                {selectedCurrency === 'ALL' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="myr_transactionVolume"
                      stroke="#DEC05F"
                      strokeWidth={2}
                      name="MYR"
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                    <Line
                      type="monotone"
                      dataKey="sgd_transactionVolume"
                      stroke={sgdColor}
                      strokeWidth={2}
                      name="SGD"
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                    <Line
                      type="monotone"
                      dataKey="usc_transactionVolume"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="USC"
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                  </>
                ) : selectedCurrency === 'MYR' ? (
                  selectedBrand && selectedBrand !== 'ALL' ? (
                    <Line
                      type="monotone"
                      dataKey={`${selectedBrand}_transactionVolume`}
                      stroke={brandColors[selectedBrand] || '#DEC05F'}
                      strokeWidth={2}
                      name={selectedBrand}
                      dot={false}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="myr_transactionVolume"
                      stroke="#DEC05F"
                      strokeWidth={2}
                      name="MYR"
                      dot={false}
                    />
                  )
                ) : selectedCurrency === 'SGD' ? (
                  selectedBrand !== 'ALL' ? (
                    <Line
                      type="monotone"
                      dataKey={`${selectedBrand}_transactionVolume`}
                      stroke={brandColors[selectedBrand]}
                      strokeWidth={2}
                      name={selectedBrand}
                      dot={false}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="sgd_transactionVolume"
                      stroke={sgdColor}
                      strokeWidth={2}
                      name="SGD"
                      dot={false}
                    />
                  )
                ) : selectedCurrency === 'USC' ? (
                  selectedBrand && selectedBrand !== 'ALL' ? (
                    <Line
                      type="monotone"
                      dataKey={`${selectedBrand}_transactionVolume`}
                      stroke={brandColors[selectedBrand] || '#3b82f6'}
                      strokeWidth={2}
                      name={selectedBrand}
                      dot={false}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="usc_transactionVolume"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="USC"
                      dot={false}
                    />
                  )
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {activeTab === 'Brand Comparison' && (
        <div className="space-y-6">
          <ChartContainer title="Brand Avg Processed Time Comparison">
            <ResponsiveContainer width="100%" height={(() => {
              // Calculate dynamic height based on number of brands
              // Minimum 300px, maximum 1000px
              // Each brand needs approximately 50px height
              const brandCount = brandComparisonData.length
              const minHeight = 300
              const maxHeight = 1000
              const heightPerBrand = 50
              const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, brandCount * heightPerBrand + 100))
              return calculatedHeight
            })()}>
              <BarChart data={brandComparisonData} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" domain={[0, 400]} stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <ReferenceLine x={300} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
                <Bar dataKey="avgTime" radius={[0, 4, 4, 0]}>
                  {brandComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="avgTime" position="right" formatter={(value) => Number(value).toFixed(0)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </ChartContainer>

        </div>
      )}

      {activeTab === 'Slow Transaction' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Total Slow Transaction"
              value={formatNumber(slowTransactionData.totalSlowTransaction)}
              change={0}
              icon={AlertCircle}
              trend="neutral"
              iconColor="text-red-500"
              iconBg="bg-red-100 dark:bg-red-900/20"
            />
            <KPICard
              title="Avg Processing Time"
              value={`${slowTransactionData.avgProcessingTime}s`}
              change={0}
              icon={Clock}
              trend="neutral"
            />
            <KPICard
              title="Brand"
              value={slowTransactionData.brand}
              change={0}
              icon={AlertTriangle}
              trend="neutral"
              iconColor="text-red-500"
              iconBg="bg-red-100 dark:bg-red-900/20"
            />
          </div>

          {/* Slow Transaction Details Table */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Slow Transaction Details (&gt; 5 Minutes)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-900">
                    <th 
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        if (slowSortColumn === 'brand') {
                          setSlowSortDirection(slowSortDirection === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSlowSortColumn('brand')
                          setSlowSortDirection('asc')
                        }
                        setSlowPage(1)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Brand
                        {slowSortColumn === 'brand' && (
                          slowSortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        if (slowSortColumn === 'customerName') {
                          setSlowSortDirection(slowSortDirection === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSlowSortColumn('customerName')
                          setSlowSortDirection('asc')
                        }
                        setSlowPage(1)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Customer Name
                        {slowSortColumn === 'customerName' && (
                          slowSortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        if (slowSortColumn === 'amount') {
                          setSlowSortDirection(slowSortDirection === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSlowSortColumn('amount')
                          setSlowSortDirection('asc')
                        }
                        setSlowPage(1)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Amount
                        {slowSortColumn === 'amount' && (
                          slowSortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        if (slowSortColumn === 'processingTime') {
                          setSlowSortDirection(slowSortDirection === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSlowSortColumn('processingTime')
                          setSlowSortDirection('asc')
                        }
                        setSlowPage(1)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Processing Time
                        {slowSortColumn === 'processingTime' && (
                          slowSortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        if (slowSortColumn === 'date') {
                          setSlowSortDirection(slowSortDirection === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSlowSortColumn('date')
                          setSlowSortDirection('asc')
                        }
                        setSlowPage(1)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {slowSortColumn === 'date' && (
                          slowSortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const slowDetails = Array.isArray(slowTransactionData.details) ? slowTransactionData.details : []
                    // Sort by selected column
                    const sortedDetails = [...slowDetails].sort((a, b) => {
                      if (!slowSortColumn) return 0
                      
                      let compareValue = 0
                      
                      switch (slowSortColumn) {
                        case 'brand':
                          const brandA = (a.brand || '').toString().toUpperCase()
                          const brandB = (b.brand || '').toString().toUpperCase()
                          compareValue = brandA.localeCompare(brandB)
                          break
                        case 'customerName':
                          const nameA = (a.customerName || '').toString().toUpperCase()
                          const nameB = (b.customerName || '').toString().toUpperCase()
                          compareValue = nameA.localeCompare(nameB)
                          break
                        case 'amount':
                          compareValue = (a.amount || 0) - (b.amount || 0)
                          break
                        case 'processingTime':
                          compareValue = (a.processingTime || 0) - (b.processingTime || 0)
                          break
                        case 'date':
                          const dateA = a.date ? new Date(a.date).getTime() : 0
                          const dateB = b.date ? new Date(b.date).getTime() : 0
                          compareValue = dateA - dateB
                          break
                        default:
                          return 0
                      }
                      
                      return slowSortDirection === 'asc' ? compareValue : -compareValue
                    })
                    const slowTotal = sortedDetails.length
                    const slowTotalPages = Math.max(1, Math.ceil(slowTotal / slowPageSize))
                    const start = (slowPage - 1) * slowPageSize
                    const paginated = sortedDetails.slice(start, start + slowPageSize)
                    return paginated.map((transaction, index) => {
                      return (
                        <tr key={start + index} className="border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white">
                              {transaction.brand}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">{transaction.customerName}</td>
                          <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(transaction.amount, selectedCurrency || 'SGD', 'S$')}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">
                            <span className={`font-semibold ${
                              transaction.processingTime > 300 ? 'text-red-600 dark:text-red-400' :
                              transaction.processingTime > 240 ? 'text-orange-600 dark:text-orange-400' :
                              'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {formatProcessingTime(transaction.processingTime)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                            {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>

              {/* Pagination controls - moved to bottom */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">Rows:</label>
                  <select
                    value={slowPageSize}
                    onChange={(e) => { setSlowPageSize(Number(e.target.value)); setSlowPage(1); }}
                    className="px-2 py-1 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  {(() => {
                    const slowDetails = Array.isArray(slowTransactionData.details) ? slowTransactionData.details : []
                    const slowTotal = slowDetails.length
                    const slowTotalPages = Math.max(1, Math.ceil(slowTotal / slowPageSize))
                    return (
                      <>
                        <div>Page {slowPage} / {slowTotalPages}</div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSlowPage(p => Math.max(1, p - 1))}
                            className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => setSlowPage(p => Math.min(slowTotalPages, p + 1))}
                            className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            Next
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Case Volume' && (
        <div className="space-y-6">
          <ChartContainer title="Total Case Volume Comparison">
            <ResponsiveContainer width="100%" height={(() => {
              // Calculate dynamic height based on number of brands
              const brandCount = caseVolumeData.length
              const minHeight = 300
              const maxHeight = 1000
              const heightPerBrand = 50
              const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, brandCount * heightPerBrand + 100))
              return calculatedHeight
            })()}>
              <BarChart data={caseVolumeData} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Bar dataKey="cases" radius={[0, 4, 4, 0]}>
                  {caseVolumeData.map((entry, idx) => (
                    <Cell key={`casecell-${idx}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="cases" position="right" formatter={(v) => Number(v).toFixed(0)} />
                </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

          <ChartContainer title="Total Overdue Transaction Comparison">
            <ResponsiveContainer width="100%" height={(() => {
              // Calculate dynamic height based on number of brands
              const brandCount = caseVolumeData.length
              const minHeight = 300
              const maxHeight = 1000
              const heightPerBrand = 50
              const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, brandCount * heightPerBrand + 100))
              return calculatedHeight
            })()}>
              <BarChart data={caseVolumeData} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Bar dataKey="totalOverdue" radius={[0, 4, 4, 0]}>
                  {caseVolumeData.map((entry, idx) => (
                    <Cell key={`overduecell-${idx}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="totalOverdue" position="right" formatter={(v) => Number(v).toFixed(0)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </div>
  )
}
