'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { logout } from '@/lib/auth'
import { useToast } from '@/lib/toast-context'
import Link from 'next/link'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useDashboardStore } from '@/lib/stores/dashboardStore'
// Removed mockData imports - using real data from Supabase
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import { subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
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
  const { user: session } = useAuth()
  const { selectedMonth, setSelectedMonth } = useFilterStore()
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
  const [bankOwnerUsedAmount, setBankOwnerUsedAmount] = useState(0)
  const [bankAccountRental, setBankAccountRental] = useState(0)
  const [wPlusAccountOutput, setWPlusAccountOutput] = useState(0)
  const [wPlusAccountRentalQuantity, setWPlusAccountRentalQuantity] = useState(0)
  
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
    async function loadDashboardData() {
      // Format dates for API
      const startDate = format(selectedMonth.start, 'yyyy-MM-dd')
      const endDate = format(selectedMonth.end, 'yyyy-MM-dd')
      
      // Fetch Deposit data from API
      try {
        // Fetch MYR deposit data
        const myrDepositResponse = await fetch(`/api/deposit/data?startDate=${startDate}&endDate=${endDate}&currency=MYR`)
        const myrDepositResult = await myrDepositResponse.json()
        
        let myrDeposit = {
          month: format(selectedMonth.start, 'MMMM yyyy'),
          currency: 'MYR',
          currencySymbol: 'RM',
          totalCount: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgProcessingTime: 0,
          dailyData: []
        }
        
        if (myrDepositResult.success && myrDepositResult.data) {
          const data = myrDepositResult.data
          myrDeposit = {
            month: format(selectedMonth.start, 'MMMM yyyy'),
            currency: 'MYR',
            currencySymbol: 'RM',
            totalCount: data.totalTransaction || 0,
            totalAmount: 0, // Amount not available in API
            avgAmount: 0,
            avgProcessingTime: data.avgProcessingTime || 0,
            dailyData: (data.dailyData || []).map(day => ({
              date: day.date,
              count: day.count || 0,
              amount: 0
            }))
          }
        }
        
        // SGD and USC deposit data (all 0)
        const sgdDeposit = {
          month: format(selectedMonth.start, 'MMMM yyyy'),
          currency: 'SGD',
          currencySymbol: 'S$',
          totalCount: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgProcessingTime: 0,
          dailyData: []
        }
        
        const uscDeposit = {
          month: format(selectedMonth.start, 'MMMM yyyy'),
          currency: 'USC',
          currencySymbol: 'US$',
          totalCount: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgProcessingTime: 0,
          dailyData: []
        }
        
        // Store individual market data for Transaction Summary
        setMarketDepositData({ MYR: myrDeposit, SGD: sgdDeposit, USC: uscDeposit })
        
        // Aggregate deposit data from all markets
        const aggregatedDeposit = {
          month: myrDeposit.month,
          currency: 'ALL',
          currencySymbol: '',
          totalCount: myrDeposit.totalCount + sgdDeposit.totalCount + uscDeposit.totalCount,
          totalAmount: myrDeposit.totalAmount + sgdDeposit.totalAmount + uscDeposit.totalAmount,
          avgAmount: (myrDeposit.totalCount + sgdDeposit.totalCount + uscDeposit.totalCount) > 0
            ? (myrDeposit.totalAmount + sgdDeposit.totalAmount + uscDeposit.totalAmount) / 
              (myrDeposit.totalCount + sgdDeposit.totalCount + uscDeposit.totalCount)
            : 0,
          avgProcessingTime: (myrDeposit.avgProcessingTime + sgdDeposit.avgProcessingTime + uscDeposit.avgProcessingTime) / 3,
          dailyData: myrDeposit.dailyData.map((day, index) => ({
            date: day.date,
            count: day.count + (sgdDeposit.dailyData[index]?.count || 0) + (uscDeposit.dailyData[index]?.count || 0),
            amount: day.amount + (sgdDeposit.dailyData[index]?.amount || 0) + (uscDeposit.dailyData[index]?.amount || 0),
          }))
        }
        
        setDepositData(aggregatedDeposit)
      } catch (error) {
        console.error('Error loading deposit data:', error)
        // On error, set all to 0
        const emptyDeposit = {
          month: format(selectedMonth.start, 'MMMM yyyy'),
          currency: 'ALL',
          currencySymbol: '',
          totalCount: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgProcessingTime: 0,
          dailyData: []
        }
        setMarketDepositData({ 
          MYR: { ...emptyDeposit, currency: 'MYR', currencySymbol: 'RM' },
          SGD: { ...emptyDeposit, currency: 'SGD', currencySymbol: 'S$' },
          USC: { ...emptyDeposit, currency: 'USC', currencySymbol: 'US$' }
        })
        setDepositData(emptyDeposit)
      }
      
      // Withdraw data (all 0 for now)
      const myrWithdraw = {
        month: format(selectedMonth.start, 'MMMM yyyy'),
        currency: 'MYR',
        currencySymbol: 'RM',
        totalCount: 0,
        totalAmount: 0,
        avgAmount: 0,
        avgProcessingTime: 0,
        dailyData: []
      }
      
      const sgdWithdraw = {
        month: format(selectedMonth.start, 'MMMM yyyy'),
        currency: 'SGD',
        currencySymbol: 'S$',
        totalCount: 0,
        totalAmount: 0,
        avgAmount: 0,
        avgProcessingTime: 0,
        dailyData: []
      }
      
      const uscWithdraw = {
        month: format(selectedMonth.start, 'MMMM yyyy'),
        currency: 'USC',
        currencySymbol: 'US$',
        totalCount: 0,
        totalAmount: 0,
        avgAmount: 0,
        avgProcessingTime: 0,
        dailyData: []
      }
      
      setMarketWithdrawData({ MYR: myrWithdraw, SGD: sgdWithdraw, USC: uscWithdraw })
      
      // Aggregate withdraw data from all markets
      const aggregatedWithdraw = {
        month: myrWithdraw.month,
        currency: 'ALL',
        currencySymbol: '',
        totalCount: 0,
        totalAmount: 0,
        avgAmount: 0,
        avgProcessingTime: 0,
        dailyData: []
      }
      
      setWithdrawData(aggregatedWithdraw)
      
      // Market Processing Data - not yet implemented, set to empty structure
      setMarketData({
        month: format(selectedMonth.start, 'MMMM yyyy'),
        totalTransactions: 0,
        totalVolume: 0,
        markets: [
          { market: 'MYR', transactions: 0, volume: 0, contribution: 0 },
          { market: 'SGD', transactions: 0, volume: 0, contribution: 0 },
          { market: 'USC', transactions: 0, volume: 0, contribution: 0 }
        ]
      })
      
      // Wealth Account Data - fetch from API
      try {
        const wealthResponse = await fetch(`/api/wealths/data?startDate=${startDate}&endDate=${endDate}`)
        const wealthResult = await wealthResponse.json()
        
        if (wealthResult.success && wealthResult.data) {
          const wealthData = wealthResult.data
          setWealthAccountData({
            month: format(selectedMonth.start, 'MMMM yyyy'),
            totalAccounts: wealthData.totalAccountCreated || 0,
            previousMonthAccounts: wealthData.previousMonthAccountCreated || 0,
            growthRate: wealthData.growthRate || 0,
            dailyData: (wealthData.dailyAccountCreation || []).map(day => ({
              date: day.date,
              accounts: day.accounts || 0
            }))
          })
        } else {
          // Set to 0 if no data
          setWealthAccountData({
            month: format(selectedMonth.start, 'MMMM yyyy'),
            totalAccounts: 0,
            previousMonthAccounts: 0,
            growthRate: 0,
            dailyData: []
          })
        }
      } catch (error) {
        console.error('Error loading wealth account data:', error)
        setWealthAccountData({
          month: format(selectedMonth.start, 'MMMM yyyy'),
          totalAccounts: 0,
          previousMonthAccounts: 0,
          growthRate: 0,
          dailyData: []
        })
      }
      
      // Bank Account Data - not yet implemented, set to empty structure
      setBankAccountData({
        month: format(selectedMonth.start, 'MMMM yyyy'),
        totalRented: 0,
        previousMonthRented: 0,
        rentalTrend: 0,
        totalUsageAmount: 0,
        avgUsagePerAccount: 0,
        usageEfficiencyRatio: 0,
        monthlyTrend: []
      })
    }
    
    loadDashboardData()
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

  // Calculate Avg Processing Time for Deposit
  const myrDepositAvgTime = marketDepositData.MYR?.avgProcessingTime || 0
  const sgdDepositAvgTime = marketDepositData.SGD?.avgProcessingTime || 0
  const usdDepositAvgTime = marketDepositData.USC?.avgProcessingTime || 0

  // Calculate Avg Processing Time for Withdraw
  const myrWithdrawAvgTime = marketWithdrawData.MYR?.avgProcessingTime || 0
  const sgdWithdrawAvgTime = marketWithdrawData.SGD?.avgProcessingTime || 0
  const usdWithdrawAvgTime = marketWithdrawData.USC?.avgProcessingTime || 0

  // Fetch Bank Owner Used Amount from API
  useEffect(() => {
    async function fetchBankOwnerUsedAmount() {
      try {
        // Get current month in YYYY-MM format
        const currentMonth = format(selectedMonth.start, 'yyyy-MM')
        
        const response = await fetch(`/api/bank-owner?month=${currentMonth}`)
        const result = await response.json()
        
        if (result.success && result.data && Array.isArray(result.data)) {
          // Calculate total from all date_values
          let total = 0
          result.data.forEach(item => {
            if (item.date_values && typeof item.date_values === 'object') {
              Object.values(item.date_values).forEach(value => {
                const numValue = parseFloat(value) || 0
                total += numValue
              })
            }
          })
          setBankOwnerUsedAmount(total)
        } else {
          setBankOwnerUsedAmount(0)
        }
      } catch (error) {
        console.error('Error fetching bank owner used amount:', error)
        setBankOwnerUsedAmount(0)
      }
    }
    
    fetchBankOwnerUsedAmount()
  }, [selectedMonth])
  
  // Fetch Bank Account Rental (Total Payment) from API - filtered by date range
  useEffect(() => {
    async function fetchBankAccountRental() {
      try {
        // Format dates for API (filter by start_date)
        const startDate = format(selectedMonth.start, 'yyyy-MM-dd')
        const endDate = format(selectedMonth.end, 'yyyy-MM-dd')
        
        // Fetch bank price data filtered by start_date date range
        const response = await fetch(`/api/bank-price?startDate=${startDate}&endDate=${endDate}`)
        const result = await response.json()
        
        console.log('Bank Account Rental - API response:', {
          success: result.success,
          totalCount: result.data?.length || 0,
          dateRange: { startDate, endDate },
          hasData: Array.isArray(result.data) && result.data.length > 0
        })
        
        if (result.success && result.data && Array.isArray(result.data)) {
          // Calculate total payment (sum of payment_total) from all accounts within the selected date range
          const totalPayment = result.data.reduce((sum, row) => {
            const payment = parseFloat(row.payment_total) || 0
            return sum + payment
          }, 0)
          
          console.log('Bank Account Rental - Total Payment:', totalPayment)
          setBankAccountRental(totalPayment)
        } else {
          console.warn('Bank Account Rental - Invalid response:', {
            success: result.success,
            hasData: !!result.data,
            isArray: Array.isArray(result.data),
            error: result.error
          })
          setBankAccountRental(0)
        }
      } catch (error) {
        console.error('Bank Account Rental - Error:', error)
        setBankAccountRental(0)
      }
    }
    
    fetchBankAccountRental()
  }, [selectedMonth])
  
  // Fetch W+ Account Output (Total Sales Quantity) and W+ Account Rental Quantity (Total Accounts Created) from API
  useEffect(() => {
    async function fetchWealthData() {
      try {
        // Format dates for API
        const startDate = format(selectedMonth.start, 'yyyy-MM-dd')
        const endDate = format(selectedMonth.end, 'yyyy-MM-dd')
        
        const response = await fetch(`/api/wealths/data?startDate=${startDate}&endDate=${endDate}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          // W+ Account Output = Total Sales Quantity
          setWPlusAccountOutput(result.data.totalSalesQuantity || 0)
          // W+ Account Rental Quantity = Total Accounts Created
          setWPlusAccountRentalQuantity(result.data.totalAccountCreated || 0)
        } else {
          setWPlusAccountOutput(0)
          setWPlusAccountRentalQuantity(0)
        }
      } catch (error) {
        console.error('Error fetching wealth data:', error)
        setWPlusAccountOutput(0)
        setWPlusAccountRentalQuantity(0)
      }
    }
    
    fetchWealthData()
  }, [selectedMonth])
  
  // Bank Summary data is now fetched from API (using state variables above)

  return (
    <div className="space-y-8">
      {/* Date Range Tabs and Filter Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4 mt-4">
          {/* Date Range Tabs - Center */}
          <nav className="inline-flex bg-white dark:bg-dark-card p-1 rounded-full" aria-label="Tabs">
            {[
              { type: 'yesterday', label: 'Yesterday' },
              { type: 'lastMonth', label: 'Last Month' },
              { type: 'thisMonth', label: 'This Month' },
            ].map((tab) => {
              const isActive = 
                (tab.type === 'yesterday' && selectedMonth?.label === 'Yesterday') ||
                (tab.type === 'lastMonth' && selectedMonth?.label === 'Last Month') ||
                (tab.type === 'thisMonth' && selectedMonth?.label === 'This Month')
              
              return (
              <button
                  key={tab.type}
                  onClick={() => {
                    const now = new Date()
                    let start, end, label
                    if (tab.type === 'yesterday') {
                      const yesterday = subDays(now, 1)
                      start = startOfDay(yesterday)
                      end = endOfDay(yesterday)
                      label = 'Yesterday'
                    } else if (tab.type === 'lastMonth') {
                      const lastMonth = subMonths(now, 1)
                      start = startOfMonth(lastMonth)
                      end = endOfMonth(lastMonth)
                      label = 'Last Month'
                    } else {
                      start = startOfMonth(now)
                      end = endOfMonth(now)
                      label = 'This Month'
                    }
                    setSelectedMonth({ start, end, label })
                  }}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                    isActive
                    ? 'bg-gold-500 text-gray-900 dark:text-gray-900 shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                  {tab.label}
              </button>
              )
            })}
          </nav>

          {/* Separator */}
          <div className="text-gray-400 dark:text-gray-600">|</div>

          {/* Filter Bar - Center */}
          <FilterBar />
        </div>
      </div>

      {/* KPI Cards - Deposit Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">Deposit</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="MYR Avg Deposit Processing Time"
            value={`${myrDepositAvgTime.toFixed(1)}s`}
            change={0}
            icon={Activity}
            trend="up"
          />
          <KPICard
            title="SGD Avg Deposit Processing Time"
            value={`${sgdDepositAvgTime.toFixed(1)}s`}
            change={0}
            icon={Activity}
            trend="up"
          />
          <KPICard
            title="USD Avg Deposit Processing Time"
            value={`${usdDepositAvgTime.toFixed(1)}s`}
            change={0}
            icon={Activity}
            trend="up"
          />
        </div>
        </div>
        
      {/* KPI Cards - Withdraw Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">Withdraw</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="MYR Avg Withdrawal Processing Time"
            value={`${myrWithdrawAvgTime.toFixed(1)}s`}
            change={0}
            icon={ArrowUpCircle}
            trend="up"
          />
          <KPICard
            title="SGD Avg Withdrawal Processing Time"
            value={`${sgdWithdrawAvgTime.toFixed(1)}s`}
            change={0}
            icon={ArrowUpCircle}
            trend="up"
          />
          <KPICard
            title="USD Avg Withdrawal Processing Time"
            value={`${usdWithdrawAvgTime.toFixed(1)}s`}
            change={0}
            icon={ArrowUpCircle}
            trend="up"
          />
        </div>
      </div>

      {/* KPI Cards - Bank Summary Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">Bank Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard
            title="Bank Owner Used Amount"
            value={formatNumber(bankOwnerUsedAmount, 2)}
            change={0}
            icon={Building2}
            trend="up"
            titleAlign="center"
          />
          <KPICard
            title="Bank Account Rental"
            value={formatNumber(bankAccountRental, 2)}
            change={0}
            icon={CreditCard}
            trend="up"
            titleAlign="center"
          />
          <KPICard
            title="W+ Account Output"
            value={formatNumber(wPlusAccountOutput)}
            change={0}
            icon={Users}
            trend="up"
            titleAlign="center"
          />
          <KPICard
            title="W+ Account Rental Quantity"
            value={formatNumber(wPlusAccountRentalQuantity)}
            change={0}
            icon={Building2}
            trend="up"
            titleAlign="center"
          />
        </div>
      </div>
    </div>
  )
}
