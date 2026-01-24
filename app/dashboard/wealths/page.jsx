'use client'

import { useEffect, useState, useRef } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useDashboardStore } from '@/lib/stores/dashboardStore'
import { getBankAccountData, getWealthAccountProductionData, getWealthAccountStatusData } from '@/lib/utils/mockData'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import KPICard from '@/components/KPICard'
import ChartContainer from '@/components/ChartContainer'
import FilterBar from '@/components/FilterBar'
import ThemeToggle from '@/components/ThemeToggle'
import { useSession, signOut } from 'next-auth/react'
import { useToast } from '@/lib/toast-context'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CreditCard, TrendingUp, Search, Bell, HelpCircle, Settings, User, ChevronDown, Power, Users, ShoppingCart, DollarSign, LineChart } from 'lucide-react'
import Link from 'next/link'

// Custom Tooltip Component for Area Chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white text-sm font-bold mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: payload[0].color || '#DEC05F' }}></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{payload[0].name || 'Value'}:</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : payload[0].value} accounts
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
    const value = payload[0].value || 0
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white text-sm font-bold mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: payload[0].color || '#DEC05F' }}></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{payload[0].name || 'Value'}:</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {value.toFixed(2)}M
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function BankAccountPage() {
  const { data: session } = useSession()
  const { selectedMonth } = useFilterStore()
  const { bankAccountData, setBankAccountData, wealthAccountData, setWealthAccountData } = useDashboardStore()
  const [selectedMarket, setSelectedMarket] = useState('SGD')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)
  
  const tabs = ['SGD', 'MYR', 'USC']

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  useEffect(() => {
    setBankAccountData(getBankAccountData(selectedMonth))
    // Load both production and status data
    const productionData = getWealthAccountProductionData(selectedMonth)
    const statusData = getWealthAccountStatusData(selectedMonth)
    setWealthAccountData({ production: productionData, status: statusData })
  }, [selectedMonth, setBankAccountData, setWealthAccountData])

  if (!bankAccountData || !wealthAccountData || !wealthAccountData.production || !wealthAccountData.status) {
    return <div>Loading...</div>
  }

  const { production, status } = wealthAccountData

  // Calculate Sales Metrics
  const totalSalesQuantity = bankAccountData.totalSalesQuantity || bankAccountData.totalRented || 0
  const totalSalesAmount = bankAccountData.totalSalesAmount || (bankAccountData.totalRented * 500) || 0
  const salesTrend = bankAccountData.salesTrend || 15.5

  // Prepare chart data for Account Production
  const productionChartData = production?.dailyData?.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accounts: day.accounts,
  })) || []

  // Prepare chart data
  const rentalTrendData = bankAccountData.monthlyTrend.map((month) => ({
    month: month.month,
    rented: month.rented,
    usage: month.usage / 1000000, // Convert to millions
  }))

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
          {/* Spacer untuk balance */}
          <div className="flex-1"></div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rental Metrics</h2>
          
          {/* Spacer untuk balance */}
          <div className="flex-1"></div>
        </div>
      </div>

      {/* Rental Content */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KPICard
            title="Total Rented Accounts"
            value={formatNumber(bankAccountData.totalRented)}
            change={bankAccountData.rentalTrend}
            icon={CreditCard}
            trend="up"
          />
          <KPICard
            title="Previous Month"
            value={formatNumber(bankAccountData.previousMonthRented)}
            change={0}
            icon={CreditCard}
            trend="up"
          />
          <KPICard
            title="Rental Trend"
            value={formatPercentage(bankAccountData.rentalTrend)}
            change={bankAccountData.rentalTrend}
            icon={TrendingUp}
            trend="up"
          />
        </div>
      </div>

      {/* Usage Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          {/* Spacer untuk balance */}
          <div className="flex-1"></div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sales Metrics</h2>
          
          {/* Spacer untuk balance */}
          <div className="flex-1"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <KPICard
            title="Total Sales Quantity"
            value={formatNumber(totalSalesQuantity)}
            change={8.5}
            icon={ShoppingCart}
            trend="up"
          />
          <KPICard
            title="Total Sales Amount"
            value={formatCurrency(totalSalesAmount, selectedMarket)}
            change={12.3}
            icon={DollarSign}
            trend="up"
          />
          <KPICard
            title="Sales Trend"
            value={`+${salesTrend.toFixed(1)}%`}
            change={salesTrend}
            icon={LineChart}
            trend="up"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Rental Trend (6 Months)"
        >
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={rentalTrendData}>
              <defs>
                <linearGradient id="colorRented" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DEC05F" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#DEC05F" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} vertical={false} />
              <XAxis dataKey="month" stroke="#6b7280" angle={-45} textAnchor="end" height={60} axisLine={{ strokeWidth: 0.5 }} tickLine={false} />
              <YAxis 
                stroke="#6b7280" 
                axisLine={{ strokeWidth: 0.5 }}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                  return value.toString()
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', paddingRight: '0px', marginTop: '-48px' }} />
              <Area
                type="monotone"
                dataKey="rented"
                stroke="#DEC05F"
                strokeWidth={2}
                fill="url(#colorRented)"
                name="Rented Accounts"
                activeDot={{ r: 5, fill: '#000000', stroke: '#DEC05F', strokeWidth: 2 }}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Usage Volume Trend (6 Months)"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={rentalTrendData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} vertical={false} />
              <XAxis dataKey="month" stroke="#6b7280" angle={-45} textAnchor="end" height={60} axisLine={{ strokeWidth: 0.5 }} tickLine={false} />
              <YAxis 
                stroke="#6b7280" 
                axisLine={{ strokeWidth: 0.5 }}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1) return `${value.toFixed(1)}M`
                  return `${(value * 1000).toFixed(0)}K`
                }}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', paddingRight: '0px', marginTop: '-48px' }} />
              <Bar dataKey="usage" fill="#DEC05F" name="Usage (M)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Production Section */}
      <div className="flex items-center justify-between mb-6">
        {/* Spacer untuk balance */}
        <div className="flex-1"></div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Production</h2>
        
        {/* Spacer untuk balance */}
        <div className="flex-1"></div>
      </div>

      {/* Production Content */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KPICard
            title="Total Accounts Created"
            value={formatNumber(production.totalAccounts)}
            change={production.growthRate}
            icon={Users}
            trend="up"
          />
          <KPICard
            title="Previous Month"
            value={formatNumber(production.previousMonthAccounts)}
            change={0}
            icon={Users}
            trend="up"
          />
          <KPICard
            title="Growth Rate"
            value={formatPercentage(production.growthRate)}
            change={production.growthRate}
            icon={TrendingUp}
            trend="up"
          />
        </div>

        <ChartContainer
          title="Daily Account Creation"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={productionChartData}>
              <defs>
                <linearGradient id="colorAccounts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DEC05F" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#DEC05F" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" angle={-45} textAnchor="end" height={60} axisLine={{ strokeWidth: 0.5 }} tickLine={false} />
              <YAxis 
                stroke="#6b7280" 
                axisLine={{ strokeWidth: 0.5 }}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                  return value.toString()
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', paddingRight: '0px', marginTop: '-48px' }} />
              <Area
                type="monotone"
                dataKey="accounts"
                stroke="#DEC05F"
                strokeWidth={2.5}
                fill="url(#colorAccounts)"
                name="New Accounts"
                activeDot={{ r: 5, fill: '#000000', stroke: '#DEC05F', strokeWidth: 2 }}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Status Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          {/* Spacer untuk balance */}
          <div className="flex-1"></div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Status & Output</h2>
          
          {/* Spacer untuk balance */}
          <div className="flex-1"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Total Accounts"
            value={formatNumber(status?.totalAccounts || 0)}
            change={0}
            icon={Users}
            trend="up"
          />
          <KPICard
            title="Active Accounts"
            value={formatNumber(status?.activeAccounts || 0)}
            change={2.5}
            icon={Users}
            trend="up"
          />
          <KPICard
            title="Output Volume"
            value={formatNumber(status?.outputVolume || 0)}
            change={5.2}
            icon={TrendingUp}
            trend="up"
          />
          <KPICard
            title="Utilization Ratio"
            value={`${(status?.utilizationRatio || 0).toFixed(1)}%`}
            change={1.8}
            icon={TrendingUp}
            trend="up"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Accounts</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatNumber(status?.totalAccounts || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Active Accounts</span>
                <span className="text-lg font-bold text-green-500">
                  {formatNumber(status?.activeAccounts || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Inactive Accounts</span>
                <span className="text-lg font-bold text-gray-500">
                  {formatNumber((status?.totalAccounts || 0) - (status?.activeAccounts || 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Output Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Output Volume</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatNumber(status?.outputVolume || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Utilization Ratio</span>
                <span className="text-lg font-bold text-gold-500">
                  {(status?.utilizationRatio || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Avg per Account</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatNumber((status?.outputVolume || 0) / (status?.activeAccounts || 1))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-900">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Month
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Rented Accounts
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Usage Amount
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Avg per Account
                </th>
              </tr>
            </thead>
            <tbody>
              {bankAccountData.monthlyTrend.map((month, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-900 hover:bg-gold-100 dark:hover:bg-gold-500/20"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{month.month}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">
                    {formatNumber(month.rented)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(month.usage, 'MYR')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(month.usage / month.rented, 'MYR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
