'use client'

import { useEffect, useState, useRef } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useDashboardStore } from '@/lib/stores/dashboardStore'
import { getWealthAccountProductionData, getWealthAccountStatusData } from '@/lib/utils/mockData'
import { formatNumber, formatPercentage } from '@/lib/utils/formatters'
import KPICard from '@/components/KPICard'
import ChartContainer from '@/components/ChartContainer'
import FilterBar from '@/components/FilterBar'
import ThemeToggle from '@/components/ThemeToggle'
import { useSession, signOut } from 'next-auth/react'
import { useToast } from '@/lib/toast-context'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, Search, Bell, HelpCircle, Settings, User, ChevronDown, Power } from 'lucide-react'
import Link from 'next/link'

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-3 shadow-lg border border-gray-700">
        <p className="text-white text-sm mb-1">{label}</p>
        <p className="text-gold-500 font-bold text-base">
          {payload[0].value} accounts
        </p>
      </div>
    )
  }
  return null
}

export default function WealthAccountPage() {
  const { data: session } = useSession()
  const { selectedMonth } = useFilterStore()
  const { wealthAccountData, setWealthAccountData } = useDashboardStore()
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
    // Load both production and status data
    const productionData = getWealthAccountProductionData(selectedMonth)
    const statusData = getWealthAccountStatusData(selectedMonth)
    setWealthAccountData({ production: productionData, status: statusData })
  }, [selectedMonth, setWealthAccountData])

  if (!wealthAccountData || !wealthAccountData.production || !wealthAccountData.status) {
    return <div>Loading...</div>
  }

  const { production, status } = wealthAccountData

  // Prepare chart data
  const productionChartData = production?.dailyData?.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accounts: day.accounts,
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wealth+ Account Monitor</h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="pl-10 pr-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 w-56"
              />
            </div>

            <button className="relative bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-50 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 transition-colors duration-150">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </button>

            <button className="bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-50 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 transition-colors duration-150">
              <HelpCircle className="h-4 w-4" />
            </button>

            <ThemeToggle />

            <Link href="/dashboard/settings" className="bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-50 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 transition-colors duration-150">
              <Settings className="h-4 w-4" />
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-300 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {session?.user?.name || 'Martin Septimus'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-300">
                  {session?.user?.role || 'Admin'}
                </span>
              </div>
              <div className="relative" ref={userDropdownRef}>
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="ml-3 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors flex items-center justify-center"
                  title="User Menu"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-900 rounded-lg shadow-lg z-50">
                    <button
                        onClick={() => {
                          showToast('Logging out...', 'success')
                          setTimeout(() => {
                            signOut({ callbackUrl: '/login' })
                          }, 500)
                          setIsUserDropdownOpen(false)
                        }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <Power className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Filter Bar - Tabs and Filter Bar center */}
        <div className="flex items-center justify-center gap-4 mt-12">
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
    </div>
  )
}
