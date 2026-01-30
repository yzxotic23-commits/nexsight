'use client'

import { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useDashboardStore } from '@/lib/stores/dashboardStore'
// Removed mock fallback - using real data only. If no data, set zeros.
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import KPICard from '@/components/KPICard'
import ChartContainer from '@/components/ChartContainer'
import FilterBar from '@/components/FilterBar'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, LabelList } from 'recharts'
import { ArrowDownCircle, Clock, Search, Bell, HelpCircle, Settings, User, ChevronDown, AlertCircle, DollarSign, AlertTriangle, Power, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/toast-context'
import { useThemeStore } from '@/lib/stores/themeStore'
import { cachedFetch } from '@/lib/hooks/useCachedFetch'

// Custom Tooltip Components
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // If multiple brands (ALL selected), show all brands
    if (payload.length > 1) {
      const total = payload.reduce((sum, p) => sum + (p.value || 0), 0)
    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700 min-w-[200px]">
          <p className="text-gray-900 dark:text-white text-sm font-bold mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            {label}
          </p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                </span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{total.toFixed(1)}</span>
              </div>
            </div>
          </div>
      </div>
    )
  }
    // Single brand or aggregate
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white text-sm font-bold mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: payload[0].color }}></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{payload[0].name}:</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : payload[0].value}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function DepositMonitorPage() {
  const { user: session } = useAuth()
  const { selectedMonth, selectedCurrency } = useFilterStore()
  const { depositData, setDepositData } = useDashboardStore()
  const { theme } = useThemeStore()
  const [activeTab, setActiveTab] = useState('Overview')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('ALL')
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)
  const brandDropdownRef = useRef(null)
  const { showToast } = useToast()
  // Pagination for Slow Transaction table
  const [slowPageSize, setSlowPageSize] = useState(20)
  const [slowPage, setSlowPage] = useState(1)
  
  // State for real deposit data from Supabase
  const [realDepositData, setRealDepositData] = useState(null)
  const [isLoadingDepositData, setIsLoadingDepositData] = useState(true)
  
  // State for ALL currency - stores data from MYR, SGD, and USC separately
  const [allCurrencyData, setAllCurrencyData] = useState({
    myr: null,
    sgd: null,
    usc: null
  })

  const tabs = ['Overview', 'Brand Comparison', 'Slow Transaction', 'Case Volume']
  const [brands, setBrands] = useState(['ALL'])
  const [isLoadingBrands, setIsLoadingBrands] = useState(false)
  
  // Fetch brands from Supabase based on selected currency
  useEffect(() => {
    async function fetchBrandsFromSupabase() {
      if (selectedCurrency === 'ALL') {
        setBrands(['ALL'])
        return
      }
      
      setIsLoadingBrands(true)
      try {
        const result = await cachedFetch('/api/settings/brand-market-mapping', {}, 10 * 60 * 1000) // 10 minutes cache for brand mapping
        
        if (result.success) {
          // Filter brands by currency and status = 'Active'
          const filteredBrands = result.data
            .filter(item => item.market === selectedCurrency && item.status === 'Active')
            .map(item => item.brand)
          
          // Add 'ALL' at the beginning
          setBrands(['ALL', ...filteredBrands])
        } else {
          console.error('Failed to fetch brands:', result.error)
          // Fallback to hardcoded brands for SGD if fetch fails
          if (selectedCurrency === 'SGD') {
            setBrands(['ALL', 'WBSG', 'M24SG', 'OK188SG', 'OXSG', 'FWSG', 'ABSG'])
          } else {
            setBrands(['ALL'])
          }
        }
      } catch (error) {
        console.error('Error fetching brands:', error)
        // Fallback to hardcoded brands for SGD if fetch fails
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
  }, [selectedCurrency])
  
  // Get available brands based on selected currency
  const getAvailableBrands = () => {
    return brands
  }
  
  const availableBrands = getAvailableBrands()

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
    // Initialize depositData in store with zeros if API hasn't returned real data yet
    const zeroDeposit = {
      month: format(selectedMonth.start, 'MMMM yyyy'),
      currency: selectedCurrency || 'ALL',
      currencySymbol: selectedCurrency === 'MYR' ? 'RM' : selectedCurrency === 'SGD' ? 'S$' : selectedCurrency === 'USC' ? 'US$' : '',
      totalCount: 0,
      totalAmount: 0,
      avgAmount: 0,
      avgProcessingTime: 0,
      dailyData: []
    }
    setDepositData(zeroDeposit)
    // Reset brand to 'ALL' when currency changes or if selected brand is not in available brands
    if (!availableBrands.includes(selectedBrand)) {
      setSelectedBrand('ALL')
    }
  }, [selectedMonth, selectedCurrency, setDepositData, availableBrands, selectedBrand])
  
  // Fetch real deposit data from Supabase
  useEffect(() => {
      async function fetchDepositData() {
      if (!selectedMonth?.start || !selectedMonth?.end) {
        return
      }
      
      setIsLoadingDepositData(true)
      try {
        // Format date as YYYY-MM-DD
        const formatLocalDate = (date) => {
          const dateObj = date instanceof Date ? date : new Date(date)
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        const startDate = formatLocalDate(selectedMonth.start)
        const endDate = formatLocalDate(selectedMonth.end)
        
        // If currency is "ALL", fetch data from all three currencies in parallel with cache
        if (selectedCurrency === 'ALL') {
          const [myrResult, sgdResult, uscResult] = await Promise.all([
            cachedFetch(`/api/deposit/data?startDate=${startDate}&endDate=${endDate}&currency=MYR&brand=ALL`),
            cachedFetch(`/api/deposit/data?startDate=${startDate}&endDate=${endDate}&currency=SGD&brand=ALL`),
            cachedFetch(`/api/deposit/data?startDate=${startDate}&endDate=${endDate}&currency=USC&brand=ALL`)
          ])
          
          // Store individual currency data
          setAllCurrencyData({
            myr: myrResult.success ? myrResult.data : null,
            sgd: sgdResult.success ? sgdResult.data : null,
            usc: uscResult.success ? uscResult.data : null
          })
          
          // Clear single currency data
          setRealDepositData(null)
        } else {
          // Fetch single currency with cache
          const result = await cachedFetch(
            `/api/deposit/data?startDate=${startDate}&endDate=${endDate}&currency=${selectedCurrency}&brand=${selectedBrand}`
          )
        if (result.success) {
          setRealDepositData(result.data)
        } else {
          console.error('Failed to fetch deposit data:', result.error)
          showToast('Failed to load deposit data', 'error')
          setRealDepositData(null)
        }
          
          // Clear ALL currency data
          setAllCurrencyData({ myr: null, sgd: null, usc: null })
        }
      } catch (error) {
        console.error('Error fetching deposit data:', error)
        showToast('Error loading deposit data', 'error')
        setRealDepositData(null)
        setAllCurrencyData({ myr: null, sgd: null, usc: null })
      } finally {
        setIsLoadingDepositData(false)
      }
    }
    
    fetchDepositData()
  }, [selectedMonth, selectedCurrency, selectedBrand, showToast])

  if (!depositData) {
    return <div>Loading...</div>
  }

  // Calculate KPI data based on selected currency and brand
  const calculateOverviewData = () => {
    // For "ALL" currency - aggregate data from MYR, SGD, and USC
    if (selectedCurrency === 'ALL' && (allCurrencyData.myr || allCurrencyData.sgd || allCurrencyData.usc)) {
      const myr = allCurrencyData.myr || {}
      const sgd = allCurrencyData.sgd || {}
      const usc = allCurrencyData.usc || {}
      
      const totalTransaction = (myr.totalTransaction || 0) + (sgd.totalTransaction || 0) + (usc.totalTransaction || 0)
      const totalTransAutomation = (myr.totalTransAutomation || 0) + (sgd.totalTransAutomation || 0) + (usc.totalTransAutomation || 0)
      const transOver60sAutomation = (myr.overdueOver60s || 0) + (sgd.overdueOver60s || 0) + (usc.overdueOver60s || 0)
      
      // Calculate weighted average for processing time and coverage rate
      const myrWeight = myr.totalTransAutomation || 0
      const sgdWeight = sgd.totalTransAutomation || 0
      const uscWeight = usc.totalTransAutomation || 0
      const totalWeight = myrWeight + sgdWeight + uscWeight
      
      const avgPTimeAutomation = totalWeight > 0
        ? ((myr.avgProcessingTime || 0) * myrWeight + (sgd.avgProcessingTime || 0) * sgdWeight + (usc.avgProcessingTime || 0) * uscWeight) / totalWeight
        : 0
      
      const coverageRate = totalTransaction > 0
        ? ((myr.coverageRate || 0) * (myr.totalTransaction || 0) + (sgd.coverageRate || 0) * (sgd.totalTransaction || 0) + (usc.coverageRate || 0) * (usc.totalTransaction || 0)) / totalTransaction
        : 0
      
      return {
        totalTransaction,
        totalTransAutomation,
        avgPTimeAutomation,
        transOver60sAutomation,
        coverageRate
      }
    }
    
    // Use real data if available (for MYR, SGD, and USC)
    if (realDepositData && (selectedCurrency === 'MYR' || selectedCurrency === 'SGD' || selectedCurrency === 'USC')) {
      return {
        totalTransaction: realDepositData.totalTransaction || 0,
        totalTransAutomation: realDepositData.totalTransAutomation || 0,
        avgPTimeAutomation: realDepositData.avgProcessingTime || 0,
        transOver60sAutomation: realDepositData.overdueOver60s || 0,
        coverageRate: realDepositData.coverageRate || 0
      }
    }
    
    // Fallback to mock data for ALL only
    const totalDays = depositData.dailyData.length
    let totalTransaction = 0
    let totalTransAutomation = 0
    let totalProcessingTime = 0
    let totalOver60s = 0
    let totalCoverage = 0
    
    depositData.dailyData.forEach((day, index) => {
      if (selectedCurrency === 'ALL') {
        // Sum all markets
        totalTransaction += day.count
        totalTransAutomation += Math.floor(day.count * 0.9)
        totalProcessingTime += 25 + (index % 10) * 1.5
        totalOver60s += Math.floor(day.count * 0.02)
        totalCoverage += 85 + (index % 10) * 1
      } else if (selectedCurrency === 'SGD') {
        if (selectedBrand === 'ALL') {
          const sgdCount = Math.floor(day.count * 0.35)
          totalTransaction += sgdCount
          totalTransAutomation += Math.floor(sgdCount * 0.9)
          totalProcessingTime += 25 + (index % 10) * 1.5 + (Math.sin(index * 7) * 10000) % 1 * 3
          totalOver60s += Math.floor(sgdCount * 0.02)
          totalCoverage += 85 + (index % 10) * 1 + (Math.sin(index * 7) * 10000) % 1 * 2
        } else {
          // Specific brand
          const multiplier = {
            'WBSG': 1.2,
            'M24SG': 1.0,
            'OK188SG': 0.9,
            'OXSG': 0.8,
            'FWSG': 0.7,
            'ABSG': 0.6
          }[selectedBrand] || 1
          
          const brandCount = Math.floor(day.count * multiplier)
          const randomSeed = index * 7 + selectedBrand.charCodeAt(0)
          const random = (Math.sin(randomSeed) * 10000) % 1
          
          totalTransaction += brandCount
          totalTransAutomation += Math.floor(brandCount * 0.9)
          totalProcessingTime += (25 + random * 15) * multiplier
          totalOver60s += Math.floor(brandCount * 0.02)
          totalCoverage += (85 + random * 10) * (multiplier * 0.9)
        }
      } else if (selectedCurrency === 'USC') {
        const uscCount = Math.floor(day.count * 0.25)
        totalTransaction += uscCount
        totalTransAutomation += Math.floor(uscCount * 0.9)
        totalProcessingTime += 25 + (index % 10) * 1.5 + (Math.sin(index * 7) * 10000) % 1 * 2
        totalOver60s += Math.floor(uscCount * 0.02)
        totalCoverage += 85 + (index % 10) * 1 + (Math.sin(index * 7) * 10000) % 1 * 1
      }
    })
    
    return {
      totalTransaction,
      totalTransAutomation,
      avgPTimeAutomation: totalDays > 0 ? totalProcessingTime / totalDays : 0,
      transOver60sAutomation: totalOver60s,
      coverageRate: totalDays > 0 ? totalCoverage / totalDays : 0
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

  // Chart data following date range - with all brands data for SGD
  // Use real data for MYR, SGD, and USC if available
  const chartData = (() => {
    // Use real data for MYR, SGD, and USC
    if ((selectedCurrency === 'MYR' || selectedCurrency === 'SGD' || selectedCurrency === 'USC') && realDepositData && realDepositData.dailyData && Array.isArray(realDepositData.dailyData)) {
      return realDepositData.dailyData
        .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date ascending
        .map(day => {
          const dateObj = new Date(day.date)
          const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          const currencyPrefix = selectedCurrency.toLowerCase()
          
          const baseObj = {
            date: formattedDate,
            originalDate: day.date, // Keep original date for sorting
            // Use real data from API
            overdueTrans: realDepositData.chartData.overdueTrans[day.date] || 0,
            avgProcessingTime: realDepositData.chartData.avgProcessingTime[day.date] || 0,
            coverageRate: realDepositData.chartData.coverageRate[day.date] || 0,
            transactionVolume: realDepositData.chartData.transactionVolume[day.date] || 0,
            // For consistency with multi-currency view
            [`${currencyPrefix}_overdueTrans`]: realDepositData.chartData.overdueTrans[day.date] || 0,
            [`${currencyPrefix}_avgProcessingTime`]: realDepositData.chartData.avgProcessingTime[day.date] || 0,
            [`${currencyPrefix}_coverageRate`]: realDepositData.chartData.coverageRate[day.date] || 0,
            [currencyPrefix]: realDepositData.chartData.transactionVolume[day.date] || 0
          }
          if (selectedBrand && selectedBrand !== 'ALL') {
            baseObj[`${selectedBrand}_overdueTrans`] = realDepositData.chartData.overdueTrans[day.date] || 0
            baseObj[`${selectedBrand}_avgProcessingTime`] = realDepositData.chartData.avgProcessingTime[day.date] || 0
            baseObj[`${selectedBrand}_coverageRate`] = realDepositData.chartData.coverageRate[day.date] || 0
            baseObj[`${selectedBrand}_transactionVolume`] = realDepositData.chartData.transactionVolume[day.date] || 0
          }
          return baseObj
        })
    }
    
    // For "ALL" currency - combine data from MYR, SGD, and USC
    if (selectedCurrency === 'ALL') {
      // Get all unique dates from all three currencies
      const allDates = new Set()
      
      if (allCurrencyData.myr?.dailyData) {
        allCurrencyData.myr.dailyData.forEach(day => allDates.add(day.date))
      }
      if (allCurrencyData.sgd?.dailyData) {
        allCurrencyData.sgd.dailyData.forEach(day => allDates.add(day.date))
      }
      if (allCurrencyData.usc?.dailyData) {
        allCurrencyData.usc.dailyData.forEach(day => allDates.add(day.date))
      }
      
      // Convert to sorted array
      const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b))
      
      return sortedDates.map(date => {
        const dateObj = new Date(date)
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        // Get data for each currency on this date
        const myrData = allCurrencyData.myr?.chartData || {}
        const sgdData = allCurrencyData.sgd?.chartData || {}
        const uscData = allCurrencyData.usc?.chartData || {}
        
        return {
          date: formattedDate,
          originalDate: date,
          // MYR data
          myr_overdueTrans: myrData.overdueTrans?.[date] || 0,
          myr_avgProcessingTime: myrData.avgProcessingTime?.[date] || 0,
          myr_coverageRate: myrData.coverageRate?.[date] || 0,
          myr: myrData.transactionVolume?.[date] || 0,
          // SGD data
          sgd_overdueTrans: sgdData.overdueTrans?.[date] || 0,
          sgd_avgProcessingTime: sgdData.avgProcessingTime?.[date] || 0,
          sgd_coverageRate: sgdData.coverageRate?.[date] || 0,
          sgd: sgdData.transactionVolume?.[date] || 0,
          // USC data
          usc_overdueTrans: uscData.overdueTrans?.[date] || 0,
          usc_avgProcessingTime: uscData.avgProcessingTime?.[date] || 0,
          usc_coverageRate: uscData.coverageRate?.[date] || 0,
          usc: uscData.transactionVolume?.[date] || 0,
        }
      })
    }
    
    // Fallback to mock data for ALL only
    return depositData.dailyData
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date ascending
      .map((day, index) => {
        const baseData = {
          date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          originalDate: day.date, // Keep original date for sorting
        }
      
      // Aggregate data for ALL
      baseData.overdueTrans = Math.floor(day.count * 0.15)
      baseData.avgProcessingTime = 25 + (index % 10) * 1.5
      baseData.coverageRate = 85 + (index % 10) * 1
      baseData.transactionVolume = day.count
      
      // Always add market data (MYR, SGD, USC) for all metrics when "ALL" is selected
      const randomVariation = (Math.sin(index * 7) * 10000) % 1
      baseData.myr_overdueTrans = Math.floor(day.count * 0.15 * 0.4)
      baseData.sgd_overdueTrans = Math.floor(day.count * 0.15 * 0.35)
      baseData.usc_overdueTrans = Math.floor(day.count * 0.15 * 0.25)
      
      baseData.myr_avgProcessingTime = 25 + (index % 10) * 1.5 + randomVariation * 5
      baseData.sgd_avgProcessingTime = 25 + (index % 10) * 1.5 + randomVariation * 3
      baseData.usc_avgProcessingTime = 25 + (index % 10) * 1.5 + randomVariation * 2
      
      baseData.myr_coverageRate = 85 + (index % 10) * 1 + randomVariation * 3
      baseData.sgd_coverageRate = 85 + (index % 10) * 1 + randomVariation * 2
      baseData.usc_coverageRate = 85 + (index % 10) * 1 + randomVariation * 1
      
      baseData.myr = Math.floor(day.count * 0.4)
      baseData.sgd = Math.floor(day.count * 0.35)
      baseData.usc = Math.floor(day.count * 0.25)
      
      return baseData
    })
  })()


  // Brand Comparison Data - Use real data if available, otherwise return empty/zero
  const brandComparisonData = (() => {
    // Use real data for MYR, SGD, and USC if available
    if ((selectedCurrency === 'MYR' || selectedCurrency === 'SGD' || selectedCurrency === 'USC') && realDepositData && realDepositData.brandComparison && Array.isArray(realDepositData.brandComparison)) {
      return realDepositData.brandComparison.map(item => ({
        brand: item.brand,
        avgTime: item.avgTime || 0,
        coverageRate: item.coverageRate || 0,
        totalTransaction: item.totalTransaction || 0,
        totalAutomation: item.totalAutomation || 0,
        totalOverdue: item.totalOverdue || 0,
        color: item.avgTime <= 30 ? '#10b981' : item.avgTime <= 60 ? '#f59e0b' : '#ef4444',
        status: item.avgTime <= 30 ? 'Fast' : item.avgTime <= 60 ? 'Moderate' : 'Slow'
      }))
    }
    
    // Return empty array for ALL (aggregate view)
    return []
  })()

  // Slow Transaction Data - Use real data if available, otherwise return zero
  const slowTransactionData = (() => {
    // Use real data for MYR, SGD, and USC if available
    if ((selectedCurrency === 'MYR' || selectedCurrency === 'SGD' || selectedCurrency === 'USC') && realDepositData && realDepositData.slowTransactions && realDepositData.slowTransactionSummary) {
      return {
        totalSlowTransaction: realDepositData.slowTransactionSummary.totalSlowTransaction || 0,
        avgProcessingTime: realDepositData.slowTransactionSummary.avgProcessingTime || 0,
        brand: realDepositData.slowTransactionSummary.brand || 'N/A',
        details: realDepositData.slowTransactions || []
      }
    }
    
    // Return zero data for ALL (aggregate view)
    return {
      totalSlowTransaction: 0,
      avgProcessingTime: 0,
      brand: 'N/A',
      details: []
    }
  })()

  // Case Volume Data - Use real data if available, otherwise return empty
  const caseVolumeData = (() => {
    // Use real data for MYR, SGD, and USC if available
    if ((selectedCurrency === 'MYR' || selectedCurrency === 'SGD' || selectedCurrency === 'USC') && realDepositData && realDepositData.caseVolume && Array.isArray(realDepositData.caseVolume)) {
      return realDepositData.caseVolume
    }
    
    // Return empty array for ALL (aggregate view)
    return []
  })()

  return (
    <div className="space-y-6">
      {/* Tabs and Filter Bar */}
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
          
          {/* Filter Bar - Right */}
          <div className="ml-auto flex items-center gap-3">
            {/* Brand Dropdown Filter - Show for all currencies if brands are available, on Overview tab */}
            {selectedCurrency !== 'ALL' && activeTab === 'Overview' && availableBrands.length > 1 ? (
              <div className="relative" ref={brandDropdownRef}>
                <button
                  onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  style={{ backgroundColor: '#DEC05F' }}
                  disabled={isLoadingBrands}
                >
                  <span className="text-gray-900 dark:text-gray-900">
                    {isLoadingBrands ? 'Loading...' : selectedBrand}
                  </span>
                  {isBrandDropdownOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900 rotate-180 transition-transform" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900 transition-transform" />
                  )}
                </button>
                {isBrandDropdownOpen && !isLoadingBrands && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Total Transaction"
              value={formatNumber(overviewData.totalTransaction)}
              change={0}
              icon={Activity}
              trend="neutral"
            />
            <KPICard
              title="Total Trans Automation"
              value={formatNumber(overviewData.totalTransAutomation)}
              change={0}
              icon={TrendingUp}
              trend="neutral"
            />
            <KPICard
              title="Avg Processing Time"
              value={`${overviewData.avgPTimeAutomation.toFixed(1)}s`}
              change={0}
              icon={Clock}
              trend="neutral"
            />
            <KPICard
              title="Overdue > 60s"
              value={formatNumber(overviewData.transOver60sAutomation)}
              change={0}
              icon={AlertCircle}
              trend="neutral"
              iconColor="text-red-500"
              iconBg="bg-red-100 dark:bg-red-900/20"
            />
            <KPICard
              title="Coverage Rate"
              value={formatPercentage(overviewData.coverageRate)}
              change={0}
              icon={ArrowDownCircle}
              trend="neutral"
            />
          </div>

          {/* Charts - Follow Date Range */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer title="Overdue Transaction">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    {brands.slice(1).map((brand) => (
                      <linearGradient key={brand} id={`color${brand}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={brandColors[brand]} stopOpacity={0.4} />
                        <stop offset="50%" stopColor={brandColors[brand]} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={brandColors[brand]} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                    <linearGradient id="colorMYROverdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DEC05F" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#DEC05F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#DEC05F" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorSGDOverdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sgdColor} stopOpacity={0.4} />
                      <stop offset="50%" stopColor={sgdColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={sgdColor} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorUSCOverdue" x1="0" y1="0" x2="0" y2="1">
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
                  <Legend 
                    verticalAlign="top" 
                    align="left" 
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', marginTop: '-10px', fontSize: '14px' }} 
                    iconType="circle" 
                    iconSize={8}
                    fontSize={14}
                  />
                  {selectedCurrency === 'ALL' ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="myr_overdueTrans"
                        stroke="#DEC05F"
                        fill="url(#colorMYROverdue)"
                        name="MYR"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="sgd_overdueTrans"
                        stroke={sgdColor}
                        fill="url(#colorSGDOverdue)"
                        name="SGD"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="usc_overdueTrans"
                        stroke="#3b82f6"
                        fill="url(#colorUSCOverdue)"
                        name="USC"
                        strokeWidth={2}
                        dot={false}
                      />
                    </>
                  ) : selectedCurrency === 'MYR' ? (
                    <Area
                      type="monotone"
                      dataKey="myr_overdueTrans"
                      stroke="#DEC05F"
                      fill="url(#colorMYROverdue)"
                      name="MYR"
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : selectedCurrency === 'SGD' ? (
                    selectedBrand !== 'ALL' ? (
                      <Area
                        type="monotone"
                        dataKey={`${selectedBrand}_overdueTrans`}
                        stroke={brandColors[selectedBrand]}
                        fill={`url(#color${selectedBrand})`}
                        name={selectedBrand}
                        strokeWidth={2}
                        dot={false}
                      />
                    ) : (
                      <Area
                        type="monotone"
                        dataKey="sgd_overdueTrans"
                        stroke={sgdColor}
                        fill="url(#colorSGDOverdue)"
                        name="SGD"
                        strokeWidth={2}
                        dot={false}
                      />
                    )
                  ) : selectedCurrency === 'USC' ? (
                    <Area
                      type="monotone"
                      dataKey="usc_overdueTrans"
                      stroke="#3b82f6"
                      fill="url(#colorUSCOverdue)"
                      name="USC"
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="overdueTrans"
                      stroke="#DEC05F"
                      fill="url(#colorAll)"
                      name="All Brands"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
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
                  <Legend 
                    verticalAlign="top" 
                    align="left" 
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', marginTop: '-10px', fontSize: '14px' }} 
                    iconType="circle" 
                    iconSize={8}
                    fontSize={14}
                  />
                  {selectedCurrency === 'ALL' ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="myr_avgProcessingTime"
                        stroke="#DEC05F"
                        strokeWidth={2}
                        name="MYR"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="sgd_avgProcessingTime"
                        stroke={sgdColor}
                        strokeWidth={2}
                        name="SGD"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="usc_avgProcessingTime"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="USC"
                        dot={false}
                      />
                    </>
                  ) : selectedCurrency === 'MYR' ? (
                    <Line
                      type="monotone"
                      dataKey="myr_avgProcessingTime"
                      stroke="#DEC05F"
                      strokeWidth={2}
                      name="MYR"
                      dot={false}
                    />
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
                    <Line
                      type="monotone"
                      dataKey="usc_avgProcessingTime"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="USC"
                      dot={false}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="avgProcessingTime"
                      stroke="#DEC05F"
                      strokeWidth={2}
                      name="All Brands"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Coverage Rate">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    {brands.slice(1).map((brand) => (
                      <linearGradient key={brand} id={`colorCoverage${brand}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={brandColors[brand]} stopOpacity={0.4} />
                        <stop offset="50%" stopColor={brandColors[brand]} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={brandColors[brand]} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                    <linearGradient id="colorMYRCoverage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DEC05F" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#DEC05F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#DEC05F" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorSGDCoverage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sgdColor} stopOpacity={0.4} />
                      <stop offset="50%" stopColor={sgdColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={sgdColor} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorUSCCoverage" x1="0" y1="0" x2="0" y2="1">
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
                  <Legend 
                    verticalAlign="top" 
                    align="left" 
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', marginTop: '-10px', fontSize: '14px' }} 
                    iconType="circle" 
                    iconSize={8}
                    fontSize={14}
                  />
                  {selectedCurrency === 'ALL' ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="myr_coverageRate"
                        stroke="#DEC05F"
                        fill="url(#colorMYRCoverage)"
                        name="MYR"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="sgd_coverageRate"
                        stroke={sgdColor}
                        fill="url(#colorSGDCoverage)"
                        name="SGD"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="usc_coverageRate"
                        stroke="#3b82f6"
                        fill="url(#colorUSCCoverage)"
                        name="USC"
                        strokeWidth={2}
                        dot={false}
                      />
                    </>
                  ) : selectedCurrency === 'MYR' ? (
                    <Area
                      type="monotone"
                      dataKey="myr_coverageRate"
                      stroke="#DEC05F"
                      fill="url(#colorMYRCoverage)"
                      name="MYR"
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : selectedCurrency === 'SGD' ? (
                    selectedBrand !== 'ALL' ? (
                      <Area
                        type="monotone"
                        dataKey={`${selectedBrand}_coverageRate`}
                        stroke={brandColors[selectedBrand]}
                        fill={`url(#colorCoverage${selectedBrand})`}
                        name={selectedBrand}
                        strokeWidth={2}
                        dot={false}
                      />
                    ) : (
                      <Area
                        type="monotone"
                        dataKey="sgd_coverageRate"
                        stroke={sgdColor}
                        fill="url(#colorSGDCoverage)"
                        name="SGD"
                        strokeWidth={2}
                        dot={false}
                      />
                    )
                  ) : selectedCurrency === 'USC' ? (
                    <Area
                      type="monotone"
                      dataKey="usc_coverageRate"
                      stroke="#3b82f6"
                      fill="url(#colorUSCCoverage)"
                      name="USC"
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="coverageRate"
                      stroke="#DEC05F"
                      fill="url(#colorCoverageAll)"
                      name="All Brands"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

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
                  <Legend 
                    verticalAlign="top" 
                    align="left" 
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', marginTop: '-10px', fontSize: '14px' }} 
                    iconType="circle" 
                    iconSize={8}
                    fontSize={14}
                  />
                  {selectedCurrency === 'ALL' ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="myr"
                        stroke="#DEC05F"
                  strokeWidth={2}
                        name="MYR"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="sgd"
                        stroke={sgdColor}
                        strokeWidth={2}
                        name="SGD"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="usc"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="USC"
                        dot={false}
                      />
                    </>
                  ) : selectedCurrency === 'MYR' ? (
                    <Line
                      type="monotone"
                      dataKey="myr"
                      stroke="#DEC05F"
                      strokeWidth={2}
                      name="MYR"
                      dot={false}
                    />
                  ) : selectedCurrency === 'SGD' ? (
                    selectedBrand !== 'ALL' ? (
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
                        dataKey="sgd"
                        stroke={sgdColor}
                        strokeWidth={2}
                        name="SGD"
                        dot={false}
                      />
                    )
                  ) : selectedCurrency === 'USC' ? (
                    <Line
                      type="monotone"
                      dataKey="usc"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="USC"
                      dot={false}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="transactionVolume"
                      stroke="#DEC05F"
                  strokeWidth={2}
                      name="All Brands"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      )}

      {/* Brand Comparison Tab */}
      {activeTab === 'Brand Comparison' && (
        <div className="space-y-6">
          {brandComparisonData.length === 0 ? (
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-gray-900 p-12 text-center">
              <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No Brand Comparison Data Available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {selectedCurrency === 'MYR' 
                  ? 'No deposit data found for the selected period.' 
                  : `Brand comparison data is only available for MYR currency. Please select MYR to view brand comparison.`}
              </p>
            </div>
          ) : (
            <>
          <ChartContainer title="Brand Avg Processed Time Comparison">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={brandComparisonData} layout="vertical" margin={{ top: 20, right: 80, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" domain={[0, 80]} stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <ReferenceLine x={60} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
                <Bar dataKey="avgTime" radius={[0, 4, 4, 0]}>
                  {brandComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList 
                    dataKey="avgTime" 
                    position="right" 
                    formatter={(value) => value.toFixed(2)}
                    className="text-gray-700 dark:text-gray-300"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </ChartContainer>

          <ChartContainer title="Coverage Rate Comparison">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={brandComparisonData} layout="vertical" margin={{ top: 20, right: 80, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Bar dataKey="coverageRate" radius={[0, 4, 4, 0]} fill="#10b981">
                  <LabelList 
                    dataKey="coverageRate" 
                    position="right" 
                    formatter={(value) => value.toFixed(2)}
                    className="text-gray-700 dark:text-gray-300"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          </>
          )}
        </div>
      )}

      {/* Slow Transaction Tab */}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Slow Transaction Details (&gt; 60 Seconds)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-900">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Brand</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Customer Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Processing Time</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const details = Array.isArray(slowTransactionData.details) ? slowTransactionData.details : []
                    if (details.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                            No slow transactions found for the selected period.
                          </td>
                        </tr>
                      )
                    }
                    const total = details.length
                    const totalPages = Math.max(1, Math.ceil(total / slowPageSize))
                    const start = (slowPage - 1) * slowPageSize
                    const paginated = details.slice(start, start + slowPageSize)
                    return paginated.map((transaction, index) => (
                      <tr key={start + index} className="border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white">
                            {transaction.brand}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">
                          {transaction.customerName || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {transaction.amount ? formatCurrency(transaction.amount, selectedCurrency || 'MYR') : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">
                          <span className={`font-semibold ${
                            transaction.processingTime > 90 ? 'text-red-600 dark:text-red-400' :
                            transaction.processingTime > 75 ? 'text-orange-600 dark:text-orange-400' :
                            'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {typeof transaction.processingTime === 'number' ? transaction.processingTime.toFixed(1) : transaction.processingTime}s
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                          {transaction.completed || 'N/A'}
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
              {/* Pagination controls - bottom */}
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
                    const details = Array.isArray(slowTransactionData.details) ? slowTransactionData.details : []
                    const total = details.length
                    const totalPages = Math.max(1, Math.ceil(total / slowPageSize))
                    return (
                      <>
                        <div>Page {slowPage} / {totalPages}</div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSlowPage(p => Math.max(1, p - 1))}
                            className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => setSlowPage(p => Math.min(totalPages, p + 1))}
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

      {/* Case Volume Tab */}
      {activeTab === 'Case Volume' && (
        <div className="space-y-6">
          {caseVolumeData.length === 0 ? (
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-gray-900 p-12 text-center">
              <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No Case Volume Data Available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {selectedCurrency === 'MYR' 
                  ? 'No case volume data found for the selected period.' 
                  : `Case volume data is only available for MYR currency. Please select MYR to view case volume.`}
              </p>
            </div>
          ) : (
            <>
          <ChartContainer title="Total Case Volume Comparison">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caseVolumeData} layout="vertical" margin={{ top: 20, right: 80, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Bar dataKey="totalCase" radius={[0, 4, 4, 0]} fill="#ef4444">
                  <LabelList 
                    dataKey="totalCase" 
                    position="right" 
                    formatter={(value) => value.toFixed(2) + '%'}
                    className="text-gray-700 dark:text-gray-300"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Total Overdue Transaction Comparison">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caseVolumeData} layout="vertical" margin={{ top: 20, right: 80, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Bar dataKey="totalOverdue" radius={[0, 4, 4, 0]} fill="#f59e0b">
                  <LabelList 
                    dataKey="totalOverdue" 
                    position="right" 
                    formatter={(value) => value}
                    className="text-gray-700 dark:text-gray-300"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                </Bar>
            </BarChart>
          </ResponsiveContainer>
          </ChartContainer>
          </>
          )}
          </div>
      )}
    </div>
  )
}
