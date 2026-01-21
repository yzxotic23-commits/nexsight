'use client'

import { useEffect, useState, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useDashboardStore } from '@/lib/stores/dashboardStore'
import {
  getMarketProcessingData,
  getDepositData,
  getWithdrawData,
  getWealthAccountProductionData,
  getWealthAccountStatusData,
  getBankAccountData,
} from '@/lib/utils/mockData'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import KPICard from '@/components/KPICard'
import ThemeToggle from '@/components/ThemeToggle'
import FilterBar from '@/components/FilterBar'
import { useThemeStore } from '@/lib/stores/themeStore'
import {
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  CreditCard,
  Activity,
  Search,
  Bell,
  HelpCircle,
  Settings,
  User,
  ChevronDown,
  Power,
  MoreVertical,
  ChevronUp,
  Building2,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function DashboardPage() {
  const { showToast } = useToast()
  const { data: session } = useSession()
  const { selectedMonth } = useFilterStore()
  const { theme } = useThemeStore()
  const [selectedBankMarket, setSelectedBankMarket] = useState('SGD')
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false)
  const [selectedMarketVolume, setSelectedMarketVolume] = useState('ALL')
  const [isMarketVolumeDropdownOpen, setIsMarketVolumeDropdownOpen] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState('SGD')
  const [marketDepositData, setMarketDepositData] = useState({ MYR: null, SGD: null, USC: null })
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)
  const [marketWithdrawData, setMarketWithdrawData] = useState({ MYR: null, SGD: null, USC: null })
  
  // Color for SGD based on theme
  const sgdColor = theme === 'dark' ? '#C0C0C0' : '#1f2937' // Silver for dark mode, dark gray for light mode
  const {
    marketData,
    depositData,
    withdrawData,
    wealthAccountData,
    bankAccountData,
    setMarketData,
    setDepositData,
    setWithdrawData,
    setWealthAccountData,
    setBankAccountData,
  } = useDashboardStore()

  const bankDropdownRef = useRef(null)
  const marketVolumeDropdownRef = useRef(null)

  // Sync Bank Accounts dropdown with tabs filter
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
    setSelectedBankMarket(selectedMarket)
  }, [selectedMarket])

  // Show login success toast after page loads
  useEffect(() => {
    const showLoginToast = localStorage.getItem('showLoginSuccessToast')
    if (showLoginToast === 'true') {
      // Delay toast untuk memastikan halaman sudah selesai dimuat
      const timer = setTimeout(() => {
        showToast('Login successful! Welcome back!', 'success')
        localStorage.removeItem('showLoginSuccessToast')
      }, 200) // Delay 300ms setelah halaman dimuat
      return () => clearTimeout(timer)
    }
  }, [showToast])

  useEffect(() => {
    // Load all dashboard data
    setMarketData(getMarketProcessingData(selectedMonth))
    
    // Get data for all 3 markets and aggregate
    const myrDeposit = getDepositData(selectedMonth, 'MYR')
    const sgdDeposit = getDepositData(selectedMonth, 'SGD')
    const uscDeposit = getDepositData(selectedMonth, 'USC')
    
    const myrWithdraw = getWithdrawData(selectedMonth, 'MYR')
    const sgdWithdraw = getWithdrawData(selectedMonth, 'SGD')
    const uscWithdraw = getWithdrawData(selectedMonth, 'USC')
    
    // Store individual market data for Transaction Summary
    setMarketDepositData({ MYR: myrDeposit, SGD: sgdDeposit, USC: uscDeposit })
    setMarketWithdrawData({ MYR: myrWithdraw, SGD: sgdWithdraw, USC: uscWithdraw })
    
    // Aggregate deposit data from all markets
    const aggregatedDeposit = {
      month: myrDeposit.month,
      currency: 'ALL',
      currencySymbol: '',
      totalCount: myrDeposit.totalCount + sgdDeposit.totalCount + uscDeposit.totalCount,
      totalAmount: myrDeposit.totalAmount + sgdDeposit.totalAmount + uscDeposit.totalAmount,
      avgAmount: (myrDeposit.totalAmount + sgdDeposit.totalAmount + uscDeposit.totalAmount) / 
                 (myrDeposit.totalCount + sgdDeposit.totalCount + uscDeposit.totalCount),
      avgProcessingTime: (myrDeposit.avgProcessingTime + sgdDeposit.avgProcessingTime + uscDeposit.avgProcessingTime) / 3,
      dailyData: myrDeposit.dailyData.map((day, index) => ({
        date: day.date,
        count: day.count + (sgdDeposit.dailyData[index]?.count || 0) + (uscDeposit.dailyData[index]?.count || 0),
        amount: day.amount + (sgdDeposit.dailyData[index]?.amount || 0) + (uscDeposit.dailyData[index]?.amount || 0),
      }))
    }
    
    // Aggregate withdraw data from all markets
    const aggregatedWithdraw = {
      month: myrWithdraw.month,
      currency: 'ALL',
      currencySymbol: '',
      totalCount: myrWithdraw.totalCount + sgdWithdraw.totalCount + uscWithdraw.totalCount,
      totalAmount: myrWithdraw.totalAmount + sgdWithdraw.totalAmount + uscWithdraw.totalAmount,
      avgAmount: (myrWithdraw.totalAmount + sgdWithdraw.totalAmount + uscWithdraw.totalAmount) / 
                 (myrWithdraw.totalCount + sgdWithdraw.totalCount + uscWithdraw.totalCount),
      avgProcessingTime: (myrWithdraw.avgProcessingTime + sgdWithdraw.avgProcessingTime + uscWithdraw.avgProcessingTime) / 3,
      dailyData: myrWithdraw.dailyData.map((day, index) => ({
        date: day.date,
        count: day.count + (sgdWithdraw.dailyData[index]?.count || 0) + (uscWithdraw.dailyData[index]?.count || 0),
        amount: day.amount + (sgdWithdraw.dailyData[index]?.amount || 0) + (uscWithdraw.dailyData[index]?.amount || 0),
      }))
    }
    
    setDepositData(aggregatedDeposit)
    setWithdrawData(aggregatedWithdraw)
    setWealthAccountData(getWealthAccountProductionData(selectedMonth))
    setBankAccountData(getBankAccountData(selectedMonth))
  }, [selectedMonth, setMarketData, setDepositData, setWithdrawData, setWealthAccountData, setBankAccountData])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target)) {
        setIsBankDropdownOpen(false)
      }
      if (marketVolumeDropdownRef.current && !marketVolumeDropdownRef.current.contains(event.target)) {
        setIsMarketVolumeDropdownOpen(false)
      }
    }
    if (isBankDropdownOpen || isMarketVolumeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isBankDropdownOpen, isMarketVolumeDropdownOpen])

  // Calculate summary KPIs - filtered by selected market
  const filteredDepositData = marketDepositData[selectedMarket]
  const filteredWithdrawData = marketWithdrawData[selectedMarket]
  
  const totalTransactions = marketData?.totalTransactions || 0
  const totalDeposit = filteredDepositData?.totalAmount || 0
  const totalWithdraw = filteredWithdrawData?.totalAmount || 0
  const totalWealthAccounts = wealthAccountData?.totalAccounts || 0
  const totalWithdrawTransactions = filteredWithdrawData?.totalCount || 0
  
  // Bank accounts - total from all markets (getBankAccountData already returns total)
  const totalBankAccounts = bankAccountData?.totalRented || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
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

            <button className="relative bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-150">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </button>

            <button className="bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-150">
              <HelpCircle className="h-4 w-4" />
            </button>

            <ThemeToggle />

            <Link href="/dashboard/settings" className="bg-white dark:bg-dark-card p-2 text-gray-700 dark:text-gray-200 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-150">
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
            {['SGD', 'MYR', 'USC'].map((tab) => (
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {/* KPI Card 1 - Total Deposit Transaction */}
        <div className="self-start">
          <KPICard
            title="Total Deposit Transaction"
            value={formatNumber(totalTransactions)}
            change={1.35}
            icon={Activity}
            trend="up"
          />
        </div>
        
        {/* KPI Card 2 - Total Deposit Amount */}
        <div className="self-start">
          <KPICard
            title="Total Deposit Amount"
            value={formatCurrency(totalDeposit, selectedMarket)}
            change={5.94}
            icon={ArrowDownCircle}
            trend="up"
          />
        </div>
        
        {/* KPI Card 3 - Total Withdraw Transaction */}
        <div className="self-start">
          <KPICard
            title="Total Withdraw Transaction"
            value={formatNumber(totalWithdrawTransactions)}
            change={2.5}
            icon={ArrowUpCircle}
            trend="up"
          />
        </div>
        
        {/* KPI Card 4 - Total Withdraw Amount */}
        <div className="self-start">
          <KPICard
            title="Total Withdraw Amount"
            value={formatCurrency(totalWithdraw, selectedMarket)}
            change={-1.45}
            icon={ArrowUpCircle}
            trend="down"
          />
        </div>
      </div>

      {/* Market Volume and Bank Accounts - Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Market Volume Card */}
        <div className="bg-white dark:bg-dark-card rounded-3xl p-4 shadow-sm border border-gray-200 dark:border-gray-900" style={{ overflow: 'visible' }}>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Volume</h3>
            {/* Legend and Filter - Top Right */}
            <div className="flex items-center gap-3">
              {/* Legend - Only show selected market(s) */}
              <div className="flex items-center gap-3">
                {(selectedMarketVolume === 'ALL' || selectedMarketVolume === 'MYR') && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-gold-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">MYR</span>
                  </div>
                )}
                {(selectedMarketVolume === 'ALL' || selectedMarketVolume === 'SGD') && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: sgdColor }}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">SGD</span>
                  </div>
                )}
                {(selectedMarketVolume === 'ALL' || selectedMarketVolume === 'USC') && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#3b82f6' }}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">USC</span>
                  </div>
                )}
              </div>
              {/* Separator */}
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
              {/* Filter Dropdown */}
              <div className="relative" ref={marketVolumeDropdownRef}>
                <button
                  onClick={() => setIsMarketVolumeDropdownOpen(!isMarketVolumeDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  style={{ backgroundColor: '#DEC05F' }}
                >
                  <Building2 className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
                  <span className="text-gray-900 dark:text-gray-900">{selectedMarketVolume}</span>
                  {isMarketVolumeDropdownOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
                  )}
                </button>
                {isMarketVolumeDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-900 rounded-lg shadow-lg z-10">
                    {['ALL', 'MYR', 'SGD', 'USC'].map((market) => (
                      <button
                        key={market}
                        onClick={() => {
                          setSelectedMarketVolume(market)
                          setIsMarketVolumeDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedMarketVolume === market
                            ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold-400 font-medium'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {marketData && (
            <div style={{ overflow: 'visible' }}>
              {/* Chart */}
              <div style={{ minHeight: '380px', height: '200px', overflow: 'visible' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(() => {
                      // Generate monthly data for last 8 months with all 3 markets
                      const months = []
                      for (let i = 7; i >= 0; i--) {
                        const date = new Date()
                        date.setMonth(date.getMonth() - i)
                        months.push({
                          month: date.toLocaleDateString('en-US', { month: 'short' }),
                          myr: Math.random() * 150 + 50,
                          sgd: Math.random() * 120 + 40,
                          usc: Math.random() * 100 + 30,
                        })
                      }
                      return months
                    })()}
                    margin={{ top: 30, right: 5, left: 5, bottom: 15 }}
                  >
                    <defs>
                      <linearGradient id="colorMYR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DEC05F" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#DEC05F" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#DEC05F" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorSGD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={sgdColor} stopOpacity={0.4} />
                        <stop offset="50%" stopColor={sgdColor} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={sgdColor} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorUSC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={1} opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280" 
                      axisLine={{ strokeWidth: 0.5 }} 
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      axisLine={{ strokeWidth: 0.5 }}
                      tickLine={false}
                      width={40}
                      tickFormatter={(value) => {
                        if (value >= 100) return `${(value / 100).toFixed(0)}K`
                        return value.toString()
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const myrValue = payload.find((p) => p.dataKey === 'myr')?.value || 0
                          const sgdValue = payload.find((p) => p.dataKey === 'sgd')?.value || 0
                          const uscValue = payload.find((p) => p.dataKey === 'usc')?.value || 0
                          
                          // Show only selected market(s) in tooltip
                          if (selectedMarketVolume === 'ALL') {
                            const total = myrValue + sgdValue + uscValue
                            return (
                              <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-3 shadow-lg border border-gray-700">
                                <p className="text-white text-sm mb-2 font-semibold">{label}</p>
                                <div className="space-y-1">
                                  <p className="text-gold-500 text-xs">MYR: {myrValue.toFixed(0)}</p>
                                  <p className="text-xs" style={{ color: theme === 'dark' ? '#C0C0C0' : '#9ca3af' }}>SGD: {sgdValue.toFixed(0)}</p>
                                  <p className="text-blue-400 text-xs">USC: {uscValue.toFixed(0)}</p>
                                  <p className="text-white text-sm font-bold mt-2 pt-2 border-t border-gray-700">
                                    Total: {total.toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            )
                          } else {
                            const value = selectedMarketVolume === 'MYR' ? myrValue : selectedMarketVolume === 'SGD' ? sgdValue : uscValue
                            const color = selectedMarketVolume === 'MYR' ? 'text-gold-500' : selectedMarketVolume === 'SGD' ? (theme === 'dark' ? '#C0C0C0' : '#9ca3af') : 'text-blue-400'
                            const colorClass = selectedMarketVolume === 'MYR' ? 'text-gold-500' : selectedMarketVolume === 'USC' ? 'text-blue-400' : ''
                            return (
                              <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-3 shadow-lg border border-gray-700">
                                <p className="text-white text-sm mb-2 font-semibold">{label}</p>
                                <p className={`${colorClass || ''} font-bold text-base`} style={!colorClass ? { color } : {}}>
                                  {selectedMarketVolume}: {value.toFixed(0)}
                                </p>
                              </div>
                            )
                          }
                        }
                        return null
                      }}
                      cursor={{ stroke: '#DEC05F', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    {selectedMarketVolume === 'ALL' || selectedMarketVolume === 'MYR' ? (
                      <Area
                        type="monotone"
                        dataKey="myr"
                        stroke="#DEC05F"
                        strokeWidth={2.5}
                        fill="url(#colorMYR)"
                        name="MYR"
                        activeDot={{ r: 5, fill: '#000000', stroke: '#DEC05F', strokeWidth: 2 }}
                        dot={false}
                      />
                    ) : null}
                    {selectedMarketVolume === 'ALL' || selectedMarketVolume === 'SGD' ? (
                      <Area
                        type="monotone"
                        dataKey="sgd"
                        stroke={sgdColor}
                        strokeWidth={2.5}
                        fill="url(#colorSGD)"
                        name="SGD"
                        activeDot={{ r: 5, fill: '#000000', stroke: sgdColor, strokeWidth: 2 }}
                        dot={false}
                      />
                    ) : null}
                    {selectedMarketVolume === 'ALL' || selectedMarketVolume === 'USC' ? (
                      <Area
                        type="monotone"
                        dataKey="usc"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#colorUSC)"
                        name="USC"
                        activeDot={{ r: 5, fill: '#000000', stroke: '#3b82f6', strokeWidth: 2 }}
                        dot={false}
                      />
                    ) : null}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Bank Accounts Card */}
        <div className="bg-white dark:bg-dark-card rounded-3xl p-4 shadow-sm border border-gray-200 dark:border-gray-900">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bank Accounts</h3>
              <div className="relative" ref={bankDropdownRef}>
                <button
                  onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  style={{ backgroundColor: '#DEC05F' }}
                >
                  <Building2 className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
                  <span className="text-gray-900 dark:text-gray-900">{selectedBankMarket}</span>
                  {isBankDropdownOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-900 dark:text-gray-900" />
                  )}
                </button>
                {isBankDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-900 rounded-lg shadow-lg z-10">
                    {['SGD', 'USC', 'MYR'].map((market) => (
                      <button
                        key={market}
                        onClick={() => {
                          setSelectedBankMarket(market)
                          setSelectedMarket(market) // Sync tabs dengan bank accounts dropdown
                          setIsBankDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedBankMarket === market
                            ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold-400 font-medium'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {(() => {
              // Bank data based on selected market
              const bankData = {
                SGD: [
                  { name: 'DBS Bank', code: 'DBS', usage: 140000 },
                  { name: 'OCBC Bank', code: 'OCBC', usage: 130000 },
                  { name: 'UOB Bank', code: 'UOB', usage: 120000 },
                  { name: 'HSBC Singapore', code: 'HSBC', usage: 110000 },
                  { name: 'Standard Chartered', code: 'SCB', usage: 100000 },
                ],
                USC: [
                  { name: 'ACLEDA Bank', code: 'ACLEDA', usage: 140000 },
                  { name: 'ABA Bank', code: 'ABA', usage: 130000 },
                  { name: 'Canadia Bank', code: 'CANADIA', usage: 120000 },
                  { name: 'Maybank Cambodia', code: 'MAYBANK', usage: 110000 },
                  { name: 'Wing Bank', code: 'WING', usage: 100000 },
                ],
                MYR: [
                  { name: 'Maybank', code: 'MAYBANK', usage: 140000 },
                  { name: 'CIMB Bank', code: 'CIMB', usage: 130000 },
                  { name: 'Public Bank', code: 'PUBLIC', usage: 120000 },
                  { name: 'RHB Bank', code: 'RHB', usage: 110000 },
                  { name: 'Hong Leong Bank', code: 'HLB', usage: 100000 },
                ],
              }
              const banks = bankData[selectedBankMarket] || bankData.SGD
              const maxUsage = Math.max(...banks.map((b) => b.usage))
              const sortedBanks = [...banks].sort((a, b) => b.usage - a.usage)

              return (
                <div className="space-y-4 pl-2 mt-1">
                  {sortedBanks.map((bank, index) => {
                    const percentage = (bank.usage / maxUsage) * 100
                    const isGold = index === 1 // Second highest gets gold
                    const barColor = isGold ? '#DEC05F' : '#1f2937'

                    return (
                      <div key={bank.code} className="space-y-1.5">
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">{bank.name}</span>
                          <span className="text-gray-500 dark:text-gray-300 ml-1.5">({bank.code})</span>
                        </div>
                        <div className="relative w-full h-7 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                          <div
                            className="h-full flex items-center justify-start pl-2.5 transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: barColor,
                            }}
                          >
                            <span className={`font-bold text-xs ${isGold ? 'text-gray-900 dark:text-gray-900' : 'text-white'}`}>
                              {formatNumber(bank.usage)}{' '}
                              <span className={`font-normal ${isGold ? 'text-gray-700 dark:text-gray-700' : 'text-white/70'}`}>accounts</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
        </div>
      </div>

      {/* Transaction Summary and Market Processing - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transaction Summary - Left */}
        <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Summary</h3>
          {filteredDepositData && filteredWithdrawData && (
            <div className="flex-1 flex items-center pt-6">
              <div className="w-full space-y-4">
                {/* Market Header */}
                <div className="grid grid-cols-4 gap-2 pb-2 border-b border-gray-200 dark:border-gray-900">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Market</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Avg Deposit</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Avg Withdraw</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Processing Time</span>
                </div>
                
                {/* Selected Market Row */}
                <div className="grid grid-cols-4 gap-2 py-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedMarket}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap">
                    {formatCurrency(filteredDepositData.avgAmount, selectedMarket)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap">
                    {formatCurrency(filteredWithdrawData.avgAmount, selectedMarket)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap">
                    {filteredDepositData.avgProcessingTime.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Market Processing Card - Right */}
        <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Processing</h3>
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
          {marketData && (
            <div>
              <div className="relative flex items-center justify-center mb-5" style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marketData.markets.map((m) => ({ name: m.market, value: m.contribution }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={0}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke={theme === 'dark' ? '#111111' : '#ffffff'}
                      strokeWidth={0}
                    >
                      {marketData.markets.map((entry, index) => {
                        const colors = ['#DEC05F', '#1f2937', '#4b5563', '#9ca3af']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-gold-100 dark:bg-gold-900/20 border-2 border-gold-500 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-gold-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {marketData.markets
                  .sort((a, b) => b.contribution - a.contribution)
                  .map((market, index) => {
                    const colors = ['#DEC05F', '#1f2937', '#4b5563', '#9ca3af']
                    return (
                      <div key={market.market} className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300 flex-1 min-w-0">{market.market}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {market.contribution.toFixed(1)}%
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
