'use client'

import { useEffect, useState, useRef } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useDashboardStore } from '@/lib/stores/dashboardStore'
import { getWithdrawData } from '@/lib/utils/mockData'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import KPICard from '@/components/KPICard'
import ChartContainer from '@/components/ChartContainer'
import FilterBar from '@/components/FilterBar'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { ArrowUpCircle, Clock, Search, Bell, HelpCircle, Settings, User, ChevronDown, AlertCircle, DollarSign, AlertTriangle, Power } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { useSession, signOut } from 'next-auth/react'
import { useToast } from '@/lib/toast-context'

// Custom Tooltip Component for Area Chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-3 shadow-lg border border-gray-700">
        <p className="text-white text-sm mb-1">{label}</p>
        <p className="text-gold-500 font-bold text-base">
          {payload[0].value.toFixed(1)}K
        </p>
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
      <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-3 shadow-lg border border-gray-700">
        <p className="text-white text-sm mb-1">{label}</p>
        <p className="text-gold-500 font-bold text-base">
          {filledValue} transactions
        </p>
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
  const [activeTab, setActiveTab] = useState('Market Overview')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)

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
    setWithdrawData(getWithdrawData(selectedMonth, selectedCurrency))
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

  const tabs = ['Market Overview', 'Brand Comparison', 'Slow Transaction', 'Case Volume']

  // Slow Transaction Data
  const slowTransactionData = {
    totalSlowCases: 4,
    totalAmountImpacted: 7200,
    slowestBrand: 'WBSG',
    currency: 'SGD',
    currencySymbol: 'S$',
    transactions: [
      {
        brand: 'WBSG',
        customerName: 'Customer A',
        amount: 1500,
        completed: '3 hours ago'
      },
      {
        brand: 'M24SG',
        customerName: 'Customer B',
        amount: 1200,
        completed: '6 hours ago'
      },
      {
        brand: 'OK188SG',
        customerName: 'Customer C',
        amount: 2500,
        completed: '1 day ago'
      },
      {
        brand: 'OXSG',
        customerName: 'Customer D',
        amount: 2000,
        completed: '2 days ago'
      }
    ]
  }

  // Calculate max amount for progress bar
  const maxAmount = Math.max(...slowTransactionData.transactions.map(t => t.amount))

  // Case Volume Data - Over-1-Minute Withdraw Cases by Brand
  const caseVolumeData = [
    { brand: 'WBSG', cases: 10.5 },
    { brand: 'M24SG', cases: 6.25 },
    { brand: 'OK188SG', cases: 4.5 },
    { brand: 'OXSG', cases: 3.25 },
    { brand: 'FWSG', cases: 1.5 },
    { brand: 'ABSG', cases: 0 },
  ]

  // Calculate total cases and identify top 2 brands
  const totalCases = caseVolumeData.reduce((sum, item) => sum + item.cases, 0)
  const sortedByCases = [...caseVolumeData].sort((a, b) => b.cases - a.cases)
  const top2Brands = sortedByCases.slice(0, 2).map(item => item.brand)
  const top2Percentage = ((sortedByCases[0].cases + sortedByCases[1].cases) / totalCases * 100).toFixed(0)

  // Add color and highlight info to data
  const caseVolumeChartData = caseVolumeData.map(item => ({
    ...item,
    color: top2Brands.includes(item.brand) ? '#dc2626' : '#f87171', // dark red for top 2, lighter red for others
    isTop2: top2Brands.includes(item.brand)
  }))

  // Custom Tooltip for Case Volume
  const CaseVolumeTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const cases = data.cases || 0
      
      return (
        <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-3 shadow-lg border border-gray-700">
          <p className="text-white text-sm font-semibold mb-1">{data.brand}</p>
          <p className="text-gold-500 text-base font-bold">{cases.toFixed(2)} cases</p>
        </div>
      )
    }
    return null
  }

  // Brand Comparison Data - Avg Processed Time (seconds)
  // Sorted by slowest first
  const brandComparisonData = [
    { brand: 'WBSG', avgTime: 72 },
    { brand: 'M24SG', avgTime: 48 },
    { brand: 'OK188SG', avgTime: 42 },
    { brand: 'OXSG', avgTime: 32 },
    { brand: 'FWSG', avgTime: 28 },
    { brand: 'ABSG', avgTime: 20 },
  ].map(item => ({
    ...item,
    // Determine color based on avgTime
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
        <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-3 shadow-lg border border-gray-700">
          <p className="text-white text-sm font-semibold mb-1">{data.brand}</p>
          <p className="text-gold-500 text-base font-bold">{avgTime.toFixed(0)} seconds</p>
          <p className="text-gray-400 text-xs mt-1">Status: {status}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdraw Transaction Monitor</h1>
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

            <button className="relative bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 transition-colors duration-150">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </button>

            <button className="bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 transition-colors duration-150">
              <HelpCircle className="h-4 w-4" />
            </button>

            <ThemeToggle />

            <Link href="/dashboard/settings" className="bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 transition-colors duration-150">
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

        {/* Tabs and Filter Bar - Tabs center, MYR and Month right */}
        <div className="flex items-center justify-between mt-12 relative">
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
          
          {/* Filter Bar - Right (MYR then Month) */}
          <div className="ml-auto flex items-center gap-3">
            <FilterBar showCurrency={true} swapOrder={true} />
          </div>
        </div>
      </div>

      {/* Market Overview - Summary from All Tabs */}
      {activeTab === 'Market Overview' && (
        <>
          {/* Summary KPI Cards from All Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Brand Comparison Summary */}
            <KPICard
              title="Slowest Brand"
              value={brandComparisonData[0]?.brand || 'N/A'}
              change={0}
              icon={AlertTriangle}
              trend="neutral"
              iconColor="text-red-500"
              iconBg="bg-red-100 dark:bg-red-900/20"
            />
            <KPICard
              title="Avg Processing Time"
              value={`${brandComparisonData[0]?.avgTime || 0}s`}
              change={0}
              icon={Clock}
              trend="neutral"
            />
            
            {/* Slow Transaction Summary */}
            <KPICard
              title="Total Slow Cases"
              value={slowTransactionData.totalSlowCases.toString()}
              change={0}
              icon={AlertCircle}
              trend="neutral"
              iconColor="text-red-500"
              iconBg="bg-red-100 dark:bg-red-900/20"
            />
            <KPICard
              title="Total Amount Impacted"
              value={formatCurrency(slowTransactionData.totalAmountImpacted, slowTransactionData.currency, slowTransactionData.currencySymbol)}
              change={0}
              icon={DollarSign}
              trend="neutral"
              iconColor="text-orange-500"
              iconBg="bg-orange-100 dark:bg-orange-900/20"
            />
          </div>

          {/* Summary Cards from Each Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Brand Comparison Summary */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Brand Comparison Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Fastest Brand</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{brandComparisonData[brandComparisonData.length - 1]?.brand || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Avg Time (Fastest)</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{brandComparisonData[brandComparisonData.length - 1]?.avgTime || 0}s</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Avg Time (Slowest)</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{brandComparisonData[0]?.avgTime || 0}s</span>
                </div>
              </div>
            </div>

            {/* Slow Transaction Summary */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Slow Transaction Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Slowest Brand Today</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{slowTransactionData.slowestBrand}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Total Cases</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{slowTransactionData.totalSlowCases}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Amount Impacted</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(slowTransactionData.totalAmountImpacted, slowTransactionData.currency, slowTransactionData.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Case Volume Summary */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Case Volume Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Total Slow Cases</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{totalCases.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Top 2 Brands</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{top2Brands.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Top 2 Share</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{top2Percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Brand Comparison' && (
        <ChartContainer
          title="Brand Avg Processed Time Comparison"
          subtitle="Processing efficiency across brands • Sorted by slowest first"
        >
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={brandComparisonData} 
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} horizontal={false} />
                <XAxis 
                  type="number"
                  domain={[0, 80]}
                  ticks={[0, 20, 40, 60, 80]}
                  stroke="#6b7280" 
                  axisLine={{ strokeWidth: 0.5 }} 
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Avg Processed Time (seconds)', position: 'bottom', offset: 10, style: { fill: '#6b7280', textAnchor: 'middle' } }}
                />
                <YAxis 
                  type="category"
                  dataKey="brand"
                  stroke="#6b7280" 
                  axisLine={{ strokeWidth: 0.5 }}
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                  width={80}
                />
                <Tooltip content={<BrandComparisonTooltip />} />
                <ReferenceLine 
                  x={60} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ value: '60s threshold', position: 'top', fill: '#ef4444', fontSize: 12 }}
                />
                <Bar 
                  dataKey="avgTime" 
                  radius={[0, 4, 4, 0]}
                >
                  {brandComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#10b981]"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Fast (0-30s)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#f59e0b]"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Moderate (30-60s)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#ef4444]"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Slow (&gt;60s)</span>
              </div>
            </div>
          </div>
        </ChartContainer>
      )}

      {activeTab === 'Slow Transaction' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Total Slow Cases"
              value={slowTransactionData.totalSlowCases.toString()}
              change={0}
              icon={AlertCircle}
              trend="neutral"
              iconColor="text-red-500"
              iconBg="bg-red-100 dark:bg-red-900/20"
            />
            <KPICard
              title="Total Amount Impacted"
              value={formatCurrency(slowTransactionData.totalAmountImpacted, slowTransactionData.currency, slowTransactionData.currencySymbol)}
              change={0}
              icon={DollarSign}
              trend="neutral"
              iconColor="text-orange-500"
              iconBg="bg-orange-100 dark:bg-orange-900/20"
            />
            <KPICard
              title="Slowest Brand Today"
              value={slowTransactionData.slowestBrand}
              change={0}
              icon={AlertTriangle}
              trend="neutral"
              iconColor="text-red-500"
              iconBg="bg-red-100 dark:bg-red-900/20"
            />
          </div>

          {/* Slow Transaction Details Table */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Slow Transaction Details (&gt; 60 seconds)</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Actionable transaction-level visibility</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Brand Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Customer Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {slowTransactionData.transactions.map((transaction, index) => {
                    const progressPercentage = (transaction.amount / maxAmount) * 100
                    return (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white">
                            {transaction.brand}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">{transaction.customerName}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              {formatCurrency(transaction.amount, slowTransactionData.currency, slowTransactionData.currencySymbol)}
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{transaction.completed}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Case Volume' && (
        <ChartContainer
          title="Over-1-Minute Withdraw Cases by Brand"
          subtitle="Operational pressure distribution • Slow case volume analysis"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={caseVolumeChartData.filter(item => item.cases > 0)} 
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} horizontal={false} />
              <XAxis 
                type="number"
                domain={[0, 12]}
                ticks={[0, 3, 6, 9, 12]}
                stroke="#6b7280" 
                axisLine={{ strokeWidth: 0.5 }} 
                tickLine={false}
                tick={{ fill: '#6b7280' }}
                label={{ value: 'Number of Slow Withdraw Cases', position: 'bottom', offset: 10, style: { fill: '#6b7280', textAnchor: 'middle' } }}
              />
              <YAxis 
                type="category"
                dataKey="brand"
                stroke="#6b7280" 
                axisLine={{ strokeWidth: 0.5 }}
                tickLine={false}
                tick={{ fill: '#6b7280' }}
                width={80}
              />
              <Tooltip content={<CaseVolumeTooltip />} />
              <Bar 
                dataKey="cases" 
                radius={[0, 4, 4, 0]}
              >
                {caseVolumeChartData.filter(item => item.cases > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Top 2 brands highlighted ({top2Percentage}% of total slow cases)
              </span>
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  )
}
