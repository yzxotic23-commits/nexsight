'use client'

import { useEffect, useState } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import KPICard from '@/components/KPICard'
import ChartContainer from '@/components/ChartContainer'
import FilterBar from '@/components/FilterBar'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/toast-context'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CreditCard, TrendingUp, Users, ShoppingCart, DollarSign, LineChart as LineChartIcon } from 'lucide-react'

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const dataKey = payload[0].dataKey || ''
    const isAmount = dataKey === 'amount'
    const isVolume = dataKey === 'volume'
    const isAccounts = dataKey === 'accounts'
    const isRented = dataKey === 'rented'
    
    const formatValue = (val) => {
      if (isAmount) {
        return `S$ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      } else if (isVolume || isAccounts || isRented) {
        return `${(val || 0).toLocaleString('en-US')} ${isAccounts ? 'accounts' : ''}`
      }
      return typeof val === 'number' ? val.toFixed(2) : val
    }
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white text-sm font-bold mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: payload[0].color || '#DEC05F' }}></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{payload[0].name || 'Value'}:</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {formatValue(value)}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function WealthsPage() {
  const { user: session } = useAuth()
  const { selectedMonth, resetToCurrentMonth } = useFilterStore()
  const { showToast } = useToast()
  const [selectedMarket, setSelectedMarket] = useState('SGD')
  
  // State for wealths data from Supabase
  const [wealthsData, setWealthsData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const tabs = ['SGD', 'MYR', 'USC']
  
  // Force reset to current month (January 2026) on component mount
  useEffect(() => {
    console.log('Current selectedMonth:', selectedMonth)
    
    // Check if we're still using old date (2025)
    if (selectedMonth?.start) {
      const currentYear = new Date(selectedMonth.start).getFullYear()
      if (currentYear < 2026) {
        console.log('Detected old date range, forcing reset to January 2026...')
        resetToCurrentMonth()
      }
    }
  }, [])

  // Fetch wealths data from API
  useEffect(() => {
    async function fetchWealthsData() {
      if (!selectedMonth?.start || !selectedMonth?.end) {
        console.log('No selectedMonth available:', selectedMonth)
        return
      }
      
      setLoading(true)
      
      // Only fetch data for SGD, set to 0 for MYR and USC
      if (selectedMarket !== 'SGD') {
        console.log(`Currency ${selectedMarket} not yet supported, showing 0 data`)
        setWealthsData({
          totalRentedAccounts: 0,
          totalRentedAmount: 0,
          previousMonthRentedAccounts: 0,
          rentalTrendPercentage: 0,
          totalSalesQuantity: 0,
          totalSalesAmount: 0,
          totalAccountCreated: 0,
          previousMonthAccountCreated: 0,
          growthRate: 0,
          dailyAccountCreation: {},
          rentalTrend: {},
          salesTrend: {},
          usageVolumeTrend: {},
        })
        setLoading(false)
        return
      }
      
      try {
        // Convert to Date object if it's a string (from localStorage)
        const startDateObj = selectedMonth.start instanceof Date 
          ? selectedMonth.start 
          : new Date(selectedMonth.start)
        const endDateObj = selectedMonth.end instanceof Date 
          ? selectedMonth.end 
          : new Date(selectedMonth.end)
        
        // Format date as YYYY-MM-DD in local timezone (avoid timezone offset)
        const formatLocalDate = (date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        const startDate = formatLocalDate(startDateObj)
        const endDate = formatLocalDate(endDateObj)
        
        console.log('Sending to API - startDate:', startDate, 'endDate:', endDate, 'currency:', selectedMarket)
        
        const response = await fetch(`/api/wealths/data?startDate=${startDate}&endDate=${endDate}`)
        const result = await response.json()
        
        console.log('API Response:', result)
        console.log('Debug info:', result.debug)
        
        if (result.success) {
          console.log('Wealths data loaded:', result.data)
          setWealthsData(result.data)
        } else {
          showToast('Failed to load wealths data', 'error')
          // Set default values
          setWealthsData({
            totalRentedAccounts: 0,
            totalRentedAmount: 0,
            previousMonthRentedAccounts: 0,
            rentalTrendPercentage: 0,
            totalSalesQuantity: 0,
            totalSalesAmount: 0,
            totalAccountCreated: 0,
            previousMonthAccountCreated: 0,
            growthRate: 0,
            dailyAccountCreation: {},
            rentalTrend: {},
            salesTrend: {},
            usageVolumeTrend: {},
          })
        }
      } catch (error) {
        console.error('Error fetching wealths data:', error)
        showToast('Error loading wealths data', 'error')
        // Set default values
        setWealthsData({
          totalRentedAccounts: 0,
          totalRentedAmount: 0,
          previousMonthRentedAccounts: 0,
          rentalTrendPercentage: 0,
          totalSalesQuantity: 0,
          totalSalesAmount: 0,
          totalAccountCreated: 0,
          previousMonthAccountCreated: 0,
          growthRate: 0,
          dailyAccountCreation: {},
          rentalTrend: {},
          salesTrend: {},
          usageVolumeTrend: {},
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchWealthsData()
  }, [selectedMonth, selectedMarket, showToast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading wealths data...</p>
        </div>
      </div>
    )
  }

  // Prepare chart data for Rental Trend (daily)
  const rentalTrendChartData = Object.entries(wealthsData?.rentalTrend || {})
    .map(([date, value]) => ({
      date: new Date(date).toISOString().split('T')[0],
      displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: value || 0
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  // Prepare chart data for Sales Trend (daily)
  const salesTrendChartData = Object.entries(wealthsData?.salesTrend || {})
    .map(([date, value]) => ({
      date: new Date(date).toISOString().split('T')[0],
      displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: value || 0
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  // Prepare chart data for Usage Volume Trend (daily)
  const usageVolumeTrendChartData = Object.entries(wealthsData?.usageVolumeTrend || {})
    .map(([date, value]) => ({
      date: new Date(date).toISOString().split('T')[0],
      displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: value || 0
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  // Prepare chart data for Daily Account Creation
  const dailyAccountCreationChartData = Object.entries(wealthsData?.dailyAccountCreation || {})
    .map(([date, value]) => ({
      date: new Date(date).toISOString().split('T')[0],
      displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      accounts: value || 0
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="space-y-6">
      {/* Tabs and Filter Bar - Tabs and Filter Bar center */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-4 mt-4">
          {/* Tabs - Center */}
          <nav className="inline-flex bg-white dark:bg-dark-card p-1 rounded-full" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedMarket(tab)}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                  selectedMarket === tab
                    ? 'bg-gold-500 text-gray-900 dark:text-gray-900 shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Separator */}
          <div className="text-gray-400 dark:text-gray-600">|</div>

          {/* Filter Bar - Center */}
          <FilterBar />
        </div>
      </div>

      {/* Rental Section */}
      <div className="top-1 lg:top-1">
        <div className="flex items-center justify-between mb-6 mt-8">
          <div className="flex-1"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rental Metrics</h2>
          <div className="flex-1"></div>
        </div>
      </div>

      {/* Rental Content */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KPICard
            title="Total Rented Accounts"
            value={formatNumber(wealthsData?.totalRentedAccounts || 0)}
            change={wealthsData?.rentalTrendPercentage || 0}
            icon={CreditCard}
            trend={wealthsData?.rentalTrendPercentage >= 0 ? "up" : "down"}
          />
          <KPICard
            title="Total Rented Amount"
            value={formatCurrency(wealthsData?.totalRentedAmount || 0, selectedMarket)}
            change={0}
            icon={DollarSign}
            trend="up"
          />
          <KPICard
            title="Previous Month"
            value={formatNumber(wealthsData?.previousMonthRentedAccounts || 0)}
            change={0}
            icon={CreditCard}
            trend="up"
          />
        </div>
      </div>

      {/* Sales Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sales Metrics</h2>
          <div className="flex-1"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <KPICard
            title="Total Sales Quantity"
            value={formatNumber(wealthsData?.totalSalesQuantity || 0)}
            change={0}
            icon={ShoppingCart}
            trend="up"
          />
          <KPICard
            title="Total Sales Amount"
            value={formatCurrency(wealthsData?.totalSalesAmount || 0, selectedMarket)}
            change={0}
            icon={DollarSign}
            trend="up"
          />
          <KPICard
            title="Sales Trend"
            value={`+${((wealthsData?.totalSalesAmount || 0) > 0 ? 12.3 : 0).toFixed(1)}%`}
            change={12.3}
            icon={LineChartIcon}
            trend="up"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Rental Trend">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={rentalTrendChartData}>
              <defs>
                <linearGradient id="colorRental" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DEC05F" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#DEC05F" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} vertical={false} />
              <XAxis dataKey="displayDate" stroke="#6b7280" angle={-45} textAnchor="end" height={60} axisLine={{ strokeWidth: 0.5 }} tickLine={false} />
              <YAxis 
                stroke="#6b7280" 
                axisLine={{ strokeWidth: 0.5 }}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000) return `S$ ${(value / 1000).toFixed(0)}K`
                  return `S$ ${value.toFixed(0)}`
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#DEC05F"
                strokeWidth={2}
                fill="url(#colorRental)"
                name="Rental Amount"
                activeDot={{ r: 5, fill: '#000000', stroke: '#DEC05F', strokeWidth: 2 }}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Sales Trend">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={salesTrendChartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} vertical={false} />
              <XAxis dataKey="displayDate" stroke="#6b7280" angle={-45} textAnchor="end" height={60} axisLine={{ strokeWidth: 0.5 }} tickLine={false} />
              <YAxis 
                stroke="#6b7280" 
                axisLine={{ strokeWidth: 0.5 }}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000) return `S$ ${(value / 1000).toFixed(0)}K`
                  return `S$ ${value.toFixed(0)}`
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorSales)"
                name="Sales Amount"
                activeDot={{ r: 5, fill: '#000000', stroke: '#3b82f6', strokeWidth: 2 }}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Usage Volume Trend Chart */}
      <ChartContainer title="Usage Volume Trend">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={usageVolumeTrendChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} vertical={false} />
            <XAxis dataKey="displayDate" stroke="#6b7280" angle={-45} textAnchor="end" height={60} axisLine={{ strokeWidth: 0.5 }} tickLine={false} />
            <YAxis 
              stroke="#6b7280" 
              axisLine={{ strokeWidth: 0.5 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '5 5' }} />
            <Line type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} name="Usage Volume" />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Production Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Production</h2>
        <div className="flex-1"></div>
      </div>

      {/* Production Content */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KPICard
            title="Total Accounts Created"
            value={formatNumber(wealthsData?.totalAccountCreated || 0)}
            change={wealthsData?.growthRate || 0}
            icon={Users}
            trend={wealthsData?.growthRate >= 0 ? "up" : "down"}
          />
          <KPICard
            title="Previous Month"
            value={formatNumber(wealthsData?.previousMonthAccountCreated || 0)}
            change={0}
            icon={Users}
            trend="up"
          />
          <KPICard
            title="Growth Rate"
            value={formatPercentage(wealthsData?.growthRate || 0)}
            change={wealthsData?.growthRate || 0}
            icon={TrendingUp}
            trend={wealthsData?.growthRate >= 0 ? "up" : "down"}
          />
        </div>

        <ChartContainer title="Daily Account Creation">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyAccountCreationChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} vertical={false} />
              <XAxis dataKey="displayDate" stroke="#6b7280" angle={-45} textAnchor="end" height={60} axisLine={{ strokeWidth: 0.5 }} tickLine={false} />
              <YAxis 
                stroke="#6b7280" 
                axisLine={{ strokeWidth: 0.5 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Bar dataKey="accounts" fill="#DEC05F" name="New Accounts" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
