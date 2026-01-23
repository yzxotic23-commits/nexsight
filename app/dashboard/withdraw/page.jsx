'use client'

import { useEffect, useState, useRef } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useDashboardStore } from '@/lib/stores/dashboardStore'
import { getWithdrawData } from '@/lib/utils/mockData'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import KPICard from '@/components/KPICard'
import ChartContainer from '@/components/ChartContainer'
import FilterBar from '@/components/FilterBar'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, LineChart, Line } from 'recharts'
import { ArrowUpCircle, ArrowDownCircle, Clock, Search, Bell, HelpCircle, Settings, User, ChevronDown, AlertCircle, DollarSign, AlertTriangle, Power, Activity, TrendingUp } from 'lucide-react'
import { useThemeStore } from '@/lib/stores/themeStore'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { useSession, signOut } from 'next-auth/react'
import { useToast } from '@/lib/toast-context'

// Custom Tooltip Component - Updated design
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const { theme } = useThemeStore.getState()
    
    // Handle multiple brands/markets
    if (payload.length > 1) {
      const markets = payload.map((p) => {
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
    const value = payload[0].value || 0
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white text-sm font-bold mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: payload[0].color || '#DEC05F' }}></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{payload[0].name}:</span>
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
  const { data: session } = useSession()
  const { selectedMonth, selectedCurrency } = useFilterStore()
  const { withdrawData, setWithdrawData } = useDashboardStore()
  const { theme } = useThemeStore()
  const [activeTab, setActiveTab] = useState('Overview')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('ALL')
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)
  const brandDropdownRef = useRef(null)

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
    setWithdrawData(getWithdrawData(selectedMonth, selectedCurrency))
    // Reset brand to 'ALL' when currency changes
    if (selectedCurrency !== 'SGD') {
      setSelectedBrand('ALL')
    }
  }, [selectedMonth, selectedCurrency, setWithdrawData])

  if (!withdrawData) {
    return <div>Loading...</div>
  }

  // Prepare chart data - daily breakdown
  const maxCount = Math.max(...withdrawData.dailyData.map((day) => day.count))
  const dailyChartData = withdrawData.dailyData.map((day) => {
    const count = day.count
    const remaining = maxCount - count
    // Highlight the bar with highest value
    const isHighlighted = count === maxCount
    return {
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: day.count,
      amount: day.amount / 1000, // Convert to thousands
      filled: count,
      remaining: remaining,
      isHighlighted: isHighlighted,
    }
  })

  const tabs = ['Overview', 'Brand Comparison', 'Slow Transaction', 'Case Volume']
  const brands = ['ALL', 'WBSG', 'M24SG', 'OK188SG', 'OXSG', 'FWSG', 'ABSG']
  
  // Get available brands based on selected currency
  const getAvailableBrands = () => {
    if (selectedCurrency === 'SGD') {
      return brands
    }
    return ['ALL']
  }
  
  const availableBrands = getAvailableBrands()
  
  // Calculate KPI data based on selected currency and brand
  const calculateOverviewData = () => {
    const totalDays = withdrawData.dailyData.length
    let totalTransaction = 0
    let totalTransAutomation = 0
    let totalProcessingTime = 0
    let totalOver60s = 0
    let totalCoverage = 0
    
    withdrawData.dailyData.forEach((day, index) => {
      if (selectedCurrency === 'ALL') {
        // Sum all markets
        totalTransaction += day.count
        totalTransAutomation += Math.floor(day.count * 0.9)
        totalProcessingTime += 25 + (index % 10) * 1.5
        totalOver60s += Math.floor(day.count * 0.02)
        totalCoverage += 85 + (index % 10) * 1
      } else if (selectedCurrency === 'MYR') {
        const myrCount = Math.floor(day.count * 0.4)
        totalTransaction += myrCount
        totalTransAutomation += Math.floor(myrCount * 0.9)
        totalProcessingTime += 25 + (index % 10) * 1.5 + (Math.sin(index * 7) * 10000) % 1 * 5
        totalOver60s += Math.floor(myrCount * 0.02)
        totalCoverage += 85 + (index % 10) * 1 + (Math.sin(index * 7) * 10000) % 1 * 3
      } else if (selectedCurrency === 'SGD') {
        if (selectedBrand === 'ALL') {
          // Sum all brands
          const sgdCount = Math.floor(day.count * 0.35)
          totalTransaction += sgdCount
          totalTransAutomation += Math.floor(sgdCount * 0.9)
          totalProcessingTime += 28 + (index % 10) * 1.5 + (Math.sin(index * 7) * 10000) % 1 * 5
          totalOver60s += Math.floor(sgdCount * 0.02)
          totalCoverage += 88 + (index % 10) * 1 + (Math.sin(index * 7) * 10000) % 1 * 3
        } else {
          // Specific brand
          const brandMultiplier = {
            'WBSG': 1.2,
            'M24SG': 1.0,
            'OK188SG': 0.9,
            'OXSG': 0.8,
            'FWSG': 0.7,
            'ABSG': 0.6
          }[selectedBrand] || 1
          
          const sgdCount = Math.floor(day.count * 0.35 * brandMultiplier)
          totalTransaction += sgdCount
          totalTransAutomation += Math.floor(sgdCount * 0.9)
          totalProcessingTime += (28 + (index % 10) * 1.5) * brandMultiplier
          totalOver60s += Math.floor(sgdCount * 0.02)
          totalCoverage += (88 + (index % 10) * 1) * brandMultiplier
        }
      } else if (selectedCurrency === 'USC') {
        const uscCount = Math.floor(day.count * 0.25)
        totalTransaction += uscCount
        totalTransAutomation += Math.floor(uscCount * 0.9)
        totalProcessingTime += 22 + (index % 10) * 1.5 + (Math.sin(index * 7) * 10000) % 1 * 5
        totalOver60s += Math.floor(uscCount * 0.02)
        totalCoverage += 82 + (index % 10) * 1 + (Math.sin(index * 7) * 10000) % 1 * 3
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
  const chartData = withdrawData.dailyData.map((day, index) => {
    const baseData = {
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }
    
    // Add data for each brand (only for SGD currency)
    if (selectedCurrency === 'SGD') {
      brands.slice(1).forEach((brand) => {
        const multiplier = {
          'WBSG': 1.2,
          'M24SG': 1.0,
          'OK188SG': 0.9,
          'OXSG': 0.8,
          'FWSG': 0.7,
          'ABSG': 0.6
        }[brand] || 1
        
        // Use index for consistent random values
        const randomSeed = index * 7 + brand.charCodeAt(0)
        const random = (Math.sin(randomSeed) * 10000) % 1
        
        baseData[`${brand}_overdueTrans`] = Math.floor(day.count * 0.15 * multiplier)
        baseData[`${brand}_avgProcessingTime`] = (25 + random * 15) * multiplier
        baseData[`${brand}_coverageRate`] = (85 + random * 10) * (multiplier * 0.9)
        baseData[`${brand}_transactionVolume`] = Math.floor(day.count * multiplier)
      })
    }
    
    // Aggregate data for ALL or when not SGD
    baseData.overdueTrans = Math.floor(day.count * 0.15)
    baseData.avgProcessingTime = 25 + (index % 10) * 1.5
    baseData.coverageRate = 85 + (index % 10) * 1
    baseData.transactionVolume = day.count
    
    // Always add market data (MYR, SGD, USC) for all metrics when "ALL" is selected
    const randomVariation = (Math.sin(index * 7) * 10000) % 1
    baseData.myr_overdueTrans = Math.floor(day.count * 0.15 * 0.4)
    baseData.myr_avgProcessingTime = 25 + (index % 10) * 1.5 + randomVariation * 5
    baseData.myr_coverageRate = 85 + (index % 10) * 1 + randomVariation * 3
    baseData.myr_transactionVolume = Math.floor(day.count * 0.4)
    
    baseData.sgd_overdueTrans = Math.floor(day.count * 0.15 * 0.35)
    baseData.sgd_avgProcessingTime = 28 + (index % 10) * 1.5 + randomVariation * 5
    baseData.sgd_coverageRate = 88 + (index % 10) * 1 + randomVariation * 3
    baseData.sgd_transactionVolume = Math.floor(day.count * 0.35)
    
    baseData.usc_overdueTrans = Math.floor(day.count * 0.15 * 0.25)
    baseData.usc_avgProcessingTime = 22 + (index % 10) * 1.5 + randomVariation * 5
    baseData.usc_coverageRate = 82 + (index % 10) * 1 + randomVariation * 3
    baseData.usc_transactionVolume = Math.floor(day.count * 0.25)
    
    return baseData
  })

  // Slow Transaction Data
  const slowTransactionData = {
    totalSlowTransaction: 245,
    avgProcessingTime: 72.5,
        brand: 'WBSG',
    details: [
      { brand: 'WBSG', customerName: 'Customer A', amount: 1200, processingTime: 65, completed: '2 hours ago' },
      { brand: 'M24SG', customerName: 'Customer B', amount: 850, processingTime: 68, completed: '5 hours ago' },
      { brand: 'OK188SG', customerName: 'Customer C', amount: 3500, processingTime: 75, completed: '1 day ago' },
      { brand: 'WBSG', customerName: 'Customer D', amount: 2100, processingTime: 82, completed: '1 day ago' },
      { brand: 'OXSG', customerName: 'Customer E', amount: 950, processingTime: 63, completed: '3 hours ago' },
    ]
  }

  // Case Volume Data
  const caseVolumeData = [
    { brand: 'WBSG', totalCase: 8.75, totalTransAutomation: 1250, totalOverdue: 245 },
    { brand: 'M24SG', totalCase: 5, totalTransAutomation: 2100, totalOverdue: 180 },
    { brand: 'OK188SG', totalCase: 3.75, totalTransAutomation: 1850, totalOverdue: 120 },
    { brand: 'OXSG', totalCase: 2.5, totalTransAutomation: 1500, totalOverdue: 95 },
    { brand: 'FWSG', totalCase: 1, totalTransAutomation: 980, totalOverdue: 45 },
    { brand: 'ABSG', totalCase: 0, totalTransAutomation: 750, totalOverdue: 20 },
  ]


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

  // Brand Comparison Data
  const brandComparisonData = [
    { brand: 'WBSG', avgTime: 72, coverageRate: 75 },
    { brand: 'M24SG', avgTime: 48, coverageRate: 82 },
    { brand: 'OK188SG', avgTime: 42, coverageRate: 88 },
    { brand: 'OXSG', avgTime: 32, coverageRate: 92 },
    { brand: 'FWSG', avgTime: 28, coverageRate: 95 },
    { brand: 'ABSG', avgTime: 20, coverageRate: 98 },
  ].map(item => ({
    ...item,
    color: item.avgTime <= 30 ? '#10b981' : item.avgTime <= 60 ? '#f59e0b' : '#ef4444',
    status: item.avgTime <= 30 ? 'Fast' : item.avgTime <= 60 ? 'Moderate' : 'Slow'
  }))

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
            {/* Brand Dropdown Filter - Only show for SGD and Overview tab */}
            {selectedCurrency === 'SGD' && activeTab === 'Overview' ? (
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
              title="Avg P.Time Automation"
              value={`${overviewData.avgPTimeAutomation.toFixed(1)}s`}
              change={0}
              icon={Clock}
              trend="neutral"
            />
            <KPICard
              title="Trans >60s Automation"
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
            <ChartContainer title="Overdue Trans Automation">
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
                  <Legend 
                    verticalAlign="top" 
                    align="left" 
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', marginTop: '-10px', fontSize: '14px' }} 
                    iconType="circle" 
                    iconSize={8}
                    fontSize={14}
                  />
                  {(selectedCurrency === 'ALL' || (selectedCurrency === 'SGD' && selectedBrand === 'ALL')) ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="myr_overdueTrans"
                        stroke="#DEC05F"
                        fill="url(#colorMYROverdueWithdraw)"
                        name="MYR"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="sgd_overdueTrans"
                        stroke={sgdColor}
                        fill="url(#colorSGDOverdueWithdraw)"
                        name="SGD"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="usc_overdueTrans"
                        stroke="#3b82f6"
                        fill="url(#colorUSCOverdueWithdraw)"
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
                      fill="url(#colorMYROverdueWithdraw)"
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
                        fill={`url(#color${selectedBrand}Withdraw)`}
                        name={selectedBrand}
                        strokeWidth={2}
                        dot={false}
                      />
                    ) : (
                      <>
                        {brands.slice(1).map((brand) => (
                          <Area
                            key={brand}
                            type="monotone"
                            dataKey={`${brand}_overdueTrans`}
                            stroke={brandColors[brand]}
                            fill={`url(#color${brand}Withdraw)`}
                            name={brand}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </>
                    )
                  ) : selectedCurrency === 'USC' ? (
                    <Area
                      type="monotone"
                      dataKey="usc_overdueTrans"
                      stroke="#3b82f6"
                      fill="url(#colorUSCOverdueWithdraw)"
                      name="USC"
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Average Processing time Automation">
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
                  {(selectedCurrency === 'ALL' || (selectedCurrency === 'SGD' && selectedBrand === 'ALL')) ? (
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
                      <>
                        {brands.slice(1).map((brand) => (
                          <Line
                            key={brand}
                            type="monotone"
                            dataKey={`${brand}_avgProcessingTime`}
                            stroke={brandColors[brand]}
                            strokeWidth={2}
                            name={brand}
                            dot={false}
                          />
                        ))}
                      </>
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
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Coverage Rate">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    {brands.slice(1).map((brand) => (
                      <linearGradient key={brand} id={`colorCoverage${brand}Withdraw`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={brandColors[brand]} stopOpacity={0.4} />
                        <stop offset="50%" stopColor={brandColors[brand]} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={brandColors[brand]} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                    <linearGradient id="colorCoverageMYRWithdraw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DEC05F" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#DEC05F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#DEC05F" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorCoverageSGDWithdraw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sgdColor} stopOpacity={0.4} />
                      <stop offset="50%" stopColor={sgdColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={sgdColor} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorCoverageUSCWithdraw" x1="0" y1="0" x2="0" y2="1">
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
                  {(selectedCurrency === 'ALL' || (selectedCurrency === 'SGD' && selectedBrand === 'ALL')) ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="myr_coverageRate"
                        stroke="#DEC05F"
                        fill="url(#colorCoverageMYRWithdraw)"
                        name="MYR"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="sgd_coverageRate"
                        stroke={sgdColor}
                        fill="url(#colorCoverageSGDWithdraw)"
                        name="SGD"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="usc_coverageRate"
                        stroke="#3b82f6"
                        fill="url(#colorCoverageUSCWithdraw)"
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
                      fill="url(#colorCoverageMYRWithdraw)"
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
                        fill={`url(#colorCoverage${selectedBrand}Withdraw)`}
                        name={selectedBrand}
                        strokeWidth={2}
                        dot={false}
                      />
                    ) : (
                      <>
                        {brands.slice(1).map((brand) => (
                          <Area
                            key={brand}
                            type="monotone"
                            dataKey={`${brand}_coverageRate`}
                            stroke={brandColors[brand]}
                            fill={`url(#colorCoverage${brand}Withdraw)`}
                            name={brand}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </>
                    )
                  ) : selectedCurrency === 'USC' ? (
                    <Area
                      type="monotone"
                      dataKey="usc_coverageRate"
                      stroke="#3b82f6"
                      fill="url(#colorCoverageUSCWithdraw)"
                      name="USC"
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : null}
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
                  {(selectedCurrency === 'ALL' || (selectedCurrency === 'SGD' && selectedBrand === 'ALL')) ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="myr_transactionVolume"
                        stroke="#DEC05F"
                  strokeWidth={2}
                        name="MYR"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="sgd_transactionVolume"
                        stroke={sgdColor}
                        strokeWidth={2}
                        name="SGD"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="usc_transactionVolume"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="USC"
                        dot={false}
                      />
                    </>
                  ) : selectedCurrency === 'MYR' ? (
                    <Line
                      type="monotone"
                      dataKey="myr_transactionVolume"
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
                        stroke={brandColors[selectedBrand]}
                        strokeWidth={2}
                        name={selectedBrand}
                        dot={false}
                      />
                    ) : (
                      <>
                        {brands.slice(1).map((brand) => (
                          <Line
                            key={brand}
                            type="monotone"
                            dataKey={`${brand}_transactionVolume`}
                            stroke={brandColors[brand]}
                            strokeWidth={2}
                            name={brand}
                            dot={false}
                          />
                        ))}
                      </>
                    )
                  ) : selectedCurrency === 'USC' ? (
                    <Line
                      type="monotone"
                      dataKey="usc_transactionVolume"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="USC"
                      dot={false}
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
                </div>
                </div>
      )}

      {activeTab === 'Brand Comparison' && (
        <div className="space-y-6">
          <ChartContainer title="Brand Avg Processed Time Comparison">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={brandComparisonData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" domain={[0, 80]} stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <ReferenceLine x={60} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
                <Bar dataKey="avgTime" radius={[0, 4, 4, 0]}>
                  {brandComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </ChartContainer>

          <ChartContainer title="Coverage Rate Comparison">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={brandComparisonData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Bar dataKey="coverageRate" radius={[0, 4, 4, 0]} fill="#10b981" />
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
                  {slowTransactionData.details.map((transaction, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white">
                            {transaction.brand}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">{transaction.customerName}</td>
                      <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount, selectedCurrency || 'SGD', 'S$')}
                        </td>
                      <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">{transaction.processingTime}s</td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{transaction.completed}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Case Volume' && (
        <div className="space-y-6">
          <ChartContainer title="Total Case Volume Comparison">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caseVolumeData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Bar dataKey="totalCase" radius={[0, 4, 4, 0]} fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

          <ChartContainer title="Total Trans Automation">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caseVolumeData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Bar dataKey="totalTransAutomation" radius={[0, 4, 4, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Total Overdue Transaction Comparison">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caseVolumeData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="brand" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Bar dataKey="totalOverdue" radius={[0, 4, 4, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </div>
  )
}
