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
import { cachedFetch } from '@/lib/hooks/useCachedFetch'
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
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true)
  
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
      setIsLoadingDashboard(true)
      
      // Format dates for API
      const startDate = format(selectedMonth.start, 'yyyy-MM-dd')
      const endDate = format(selectedMonth.end, 'yyyy-MM-dd')
      const currentMonth = format(selectedMonth.start, 'yyyy-MM')
      
      // Fetch ALL data in parallel with caching for maximum speed
      const [
        depositResults, 
        withdrawResults,
        wealthResult, 
        bankOwnerResult, 
        bankAccountResult, 
        wnleResult
      ] = await Promise.allSettled([
        // Fetch all deposit currencies in parallel with cache
        Promise.all([
          cachedFetch(`/api/deposit/data?startDate=${startDate}&endDate=${endDate}&currency=MYR&brand=ALL`),
          cachedFetch(`/api/deposit/data?startDate=${startDate}&endDate=${endDate}&currency=SGD&brand=ALL`),
          cachedFetch(`/api/deposit/data?startDate=${startDate}&endDate=${endDate}&currency=USC&brand=ALL`)
        ]),
        // Fetch all withdraw currencies in parallel with cache
        Promise.all([
          cachedFetch(`/api/withdraw/data?startDate=${startDate}&endDate=${endDate}&currency=MYR&brand=ALL`),
          cachedFetch(`/api/withdraw/data?startDate=${startDate}&endDate=${endDate}&currency=SGD&brand=ALL`),
          cachedFetch(`/api/withdraw/data?startDate=${startDate}&endDate=${endDate}&currency=USC&brand=ALL`)
        ]),
        // Fetch wealth data with cache
        cachedFetch(`/api/wealths/data?startDate=${startDate}&endDate=${endDate}`),
        // Fetch bank owner data with cache (longer cache for monthly data)
        cachedFetch(`/api/bank-owner?month=${currentMonth}&currency=SGD`, {}, 10 * 60 * 1000), // 10 minutes
        // Fetch bank account rental data with cache - filter by start_date within selected month and currency
        cachedFetch(`/api/bank-price?currency=${selectedBankMarket}&startDate=${startDate}&endDate=${endDate}`, {}, 2 * 60 * 1000), // 2 minutes (shorter cache since filtered by date)
        // Fetch WNLE count with cache
        cachedFetch(`/api/wealths/wnle-count?startDate=${startDate}&endDate=${endDate}`)
      ])
      
      // Process Deposit data
      try {
        if (depositResults.status === 'fulfilled') {
          const [myrDepositResult, sgdDepositResult, uscDepositResult] = depositResults.value
        
        // Process MYR deposit data
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
        
        // Process SGD deposit data
        let sgdDeposit = {
          month: format(selectedMonth.start, 'MMMM yyyy'),
          currency: 'SGD',
          currencySymbol: 'S$',
          totalCount: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgProcessingTime: 0,
          dailyData: []
        }
        
        if (sgdDepositResult.success && sgdDepositResult.data) {
          const data = sgdDepositResult.data
          sgdDeposit = {
            month: format(selectedMonth.start, 'MMMM yyyy'),
            currency: 'SGD',
            currencySymbol: 'S$',
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
        
        // Process USC deposit data
        let uscDeposit = {
          month: format(selectedMonth.start, 'MMMM yyyy'),
          currency: 'USC',
          currencySymbol: 'US$',
          totalCount: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgProcessingTime: 0,
          dailyData: []
        }
        
        if (uscDepositResult.success && uscDepositResult.data) {
          const data = uscDepositResult.data
          uscDeposit = {
            month: format(selectedMonth.start, 'MMMM yyyy'),
            currency: 'USC',
            currencySymbol: 'US$',
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
        
        // Store individual market data for Transaction Summary
        setMarketDepositData({ MYR: myrDeposit, SGD: sgdDeposit, USC: uscDeposit })
        
        // Aggregate deposit data from all markets
        const totalCount = myrDeposit.totalCount + sgdDeposit.totalCount + uscDeposit.totalCount
        
        // Calculate weighted average for processing time
        const avgProcessingTime = totalCount > 0
          ? (
              (myrDeposit.avgProcessingTime * myrDeposit.totalCount) + 
              (sgdDeposit.avgProcessingTime * sgdDeposit.totalCount) + 
              (uscDeposit.avgProcessingTime * uscDeposit.totalCount)
            ) / totalCount
          : 0
        
        const aggregatedDeposit = {
          month: myrDeposit.month,
          currency: 'ALL',
          currencySymbol: '',
          totalCount,
          totalAmount: myrDeposit.totalAmount + sgdDeposit.totalAmount + uscDeposit.totalAmount,
          avgAmount: totalCount > 0
            ? (myrDeposit.totalAmount + sgdDeposit.totalAmount + uscDeposit.totalAmount) / totalCount
            : 0,
          avgProcessingTime,
          dailyData: myrDeposit.dailyData.map((day, index) => ({
            date: day.date,
            count: day.count + (sgdDeposit.dailyData[index]?.count || 0) + (uscDeposit.dailyData[index]?.count || 0),
            amount: day.amount + (sgdDeposit.dailyData[index]?.amount || 0) + (uscDeposit.dailyData[index]?.amount || 0),
          }))
        }
        
        setDepositData(aggregatedDeposit)
        }
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
      
      // Process Withdraw data
      try {
        if (withdrawResults.status === 'fulfilled') {
          const [myrResult, sgdResult, uscResult] = withdrawResults.value

          const buildWithdrawObj = (res, currency, symbol) => {
            if (!res || !res.success || !res.data) {
              return {
                month: format(selectedMonth.start, 'MMMM yyyy'),
                currency,
                currencySymbol: symbol,
                totalCount: 0,
                totalAmount: 0,
                avgAmount: 0,
                avgProcessingTime: 0,
                dailyData: []
              }
            }
            const d = res.data
            return {
              month: format(selectedMonth.start, 'MMMM yyyy'),
              currency,
              currencySymbol: symbol,
              totalCount: d.totalTransaction || 0,
              totalAmount: d.totalAmount || 0,
              avgAmount: d.avgAmount || 0,
              avgProcessingTime: d.avgProcessingTime || 0,
              dailyData: (d.dailyData || []).map(day => ({ date: day.date, count: day.count || 0, amount: day.amount || 0 }))
            }
          }

          const myrWithdraw = buildWithdrawObj(myrResult, 'MYR', 'RM')
          const sgdWithdraw = buildWithdrawObj(sgdResult, 'SGD', 'S$')
          const uscWithdraw = buildWithdrawObj(uscResult, 'USC', 'US$')

          setMarketWithdrawData({ MYR: myrWithdraw, SGD: sgdWithdraw, USC: uscWithdraw })

          // Aggregate withdraw data from all markets
          const aggregatedWithdraw = {
            month: myrWithdraw.month,
            currency: 'ALL',
            currencySymbol: '',
            totalCount: (myrWithdraw.totalCount || 0) + (sgdWithdraw.totalCount || 0) + (uscWithdraw.totalCount || 0),
            totalAmount: (myrWithdraw.totalAmount || 0) + (sgdWithdraw.totalAmount || 0) + (uscWithdraw.totalAmount || 0),
            avgAmount: 0,
            avgProcessingTime: 0,
            dailyData: []
          }
          setWithdrawData(aggregatedWithdraw)
        } else {
          // Set empty withdraw data on error
          const emptyWithdraw = {
            month: format(selectedMonth.start, 'MMMM yyyy'),
            currency: 'ALL',
            currencySymbol: '',
            totalCount: 0,
            totalAmount: 0,
            avgAmount: 0,
            avgProcessingTime: 0,
            dailyData: []
          }
          setMarketWithdrawData({
            MYR: { ...emptyWithdraw, currency: 'MYR', currencySymbol: 'RM' },
            SGD: { ...emptyWithdraw, currency: 'SGD', currencySymbol: 'S$' },
            USC: { ...emptyWithdraw, currency: 'USC', currencySymbol: 'US$' }
          })
          setWithdrawData(emptyWithdraw)
        }
      } catch (err) {
        console.error('Error processing withdraw data:', err)
        const emptyWithdraw = {
          month: format(selectedMonth.start, 'MMMM yyyy'),
          currency: 'ALL',
          currencySymbol: '',
          totalCount: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgProcessingTime: 0,
          dailyData: []
        }
        setMarketWithdrawData({
          MYR: { ...emptyWithdraw, currency: 'MYR', currencySymbol: 'RM' },
          SGD: { ...emptyWithdraw, currency: 'SGD', currencySymbol: 'S$' },
          USC: { ...emptyWithdraw, currency: 'USC', currencySymbol: 'US$' }
        })
        setWithdrawData(emptyWithdraw)
      }
      
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
      
      // Process Wealth Account Data
      try {
        if (wealthResult.status === 'fulfilled' && wealthResult.value.success && wealthResult.value.data) {
          const wealthData = wealthResult.value.data
          
          // Convert dailyAccountCreation object to array
          const dailyDataArray = wealthData.dailyAccountCreation && typeof wealthData.dailyAccountCreation === 'object'
            ? Object.entries(wealthData.dailyAccountCreation).map(([date, accounts]) => ({
                date,
                accounts
              })).sort((a, b) => new Date(a.date) - new Date(b.date))
            : []
          
          setWealthAccountData({
            month: format(selectedMonth.start, 'MMMM yyyy'),
            totalAccounts: wealthData.totalAccountCreated || 0,
            previousMonthAccounts: wealthData.previousMonthAccountCreated || 0,
            growthRate: wealthData.growthRate || 0,
            dailyData: dailyDataArray
          })
          
          // Set W+ Account Rental Quantity from wealth data
          setWPlusAccountRentalQuantity(wealthData.totalSalesQuantity || 0)
        } else {
          // Set to 0 if no data
          setWealthAccountData({
            month: format(selectedMonth.start, 'MMMM yyyy'),
            totalAccounts: 0,
            previousMonthAccounts: 0,
            growthRate: 0,
            dailyData: []
          })
          setWPlusAccountRentalQuantity(0)
        }
      } catch (error) {
        console.error('Error processing wealth account data:', error)
        setWealthAccountData({
          month: format(selectedMonth.start, 'MMMM yyyy'),
          totalAccounts: 0,
          previousMonthAccounts: 0,
          growthRate: 0,
          dailyData: []
        })
        setWPlusAccountRentalQuantity(0)
      }
      
      // Process Bank Owner Used Amount
      // Data diambil dari bank account rental module dengan filter tanggal
      try {
        if (bankOwnerResult.status === 'fulfilled' && bankOwnerResult.value.success && bankOwnerResult.value.data && Array.isArray(bankOwnerResult.value.data)) {
          let total = 0
          
          // Get the date range for filtering
          const start = new Date(selectedMonth.start)
          const end = new Date(selectedMonth.end)
          
          // Month names for date formatting (matching bank account rental module format)
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          
          // Create array of date keys in format "DD-MMM" (e.g., "01-Jan", "15-Jan")
          const dateKeysInRange = []
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const day = String(d.getDate()).padStart(2, '0')
            const monthName = monthNames[d.getMonth()]
            const dateKey = `${day}-${monthName}`
            dateKeysInRange.push(dateKey)
          }
          
          bankOwnerResult.value.data.forEach(item => {
            if (item.date_values && typeof item.date_values === 'object') {
              // Only sum values for dates within the selected range
              // date_values format: {"01-Jan": "912.52", "05-Jan": "738.52"}
              Object.entries(item.date_values).forEach(([dateKey, value]) => {
                if (dateKeysInRange.includes(dateKey)) {
                  // Parse value, handling commas and empty strings
                  const numValue = parseFloat(String(value).replace(/,/g, '')) || 0
                  total += numValue
                }
              })
            }
          })
          setBankOwnerUsedAmount(total)
        } else {
          setBankOwnerUsedAmount(0)
        }
      } catch (error) {
        console.error('Error processing bank owner data:', error)
        setBankOwnerUsedAmount(0)
      }
      
      // Process Bank Account Rental (Total Payment)
      // Data diambil dari bank account rental module dengan filter tanggal
      // Menggunakan logika yang sama dengan menu bank account rental: days remaining in month dari start date
      try {
        if (bankAccountResult.status === 'fulfilled' && bankAccountResult.value.success && bankAccountResult.value.data && Array.isArray(bankAccountResult.value.data)) {
          // Get the selected date range for filtering
          const selectedStart = new Date(selectedMonth.start)
          const selectedEnd = new Date(selectedMonth.end)
          const selectedStartStr = format(selectedStart, 'yyyy-MM-dd')
          const selectedEndStr = format(selectedEnd, 'yyyy-MM-dd')
          
          // Function to calculate payment total - sama persis dengan menu bank account rental
          const calculatePaymentTotal = (row) => {
            const sellOff = String(row.sell_off || '').toUpperCase().trim()
            const startDate = row.start_date
            const rentalCommission = parseFloat(String(row.rental_commission || 0).replace(/,/g, '')) || 0
            const commission = parseFloat(String(row.commission || 0).replace(/,/g, '')) || 0
            const addition = parseFloat(String(row.addition || 0).replace(/,/g, '')) || 0

            // If Sell-OFF is "OFF", return H+I+L
            if (sellOff === 'OFF') {
              return rentalCommission + commission + addition
            }

            // If Rental Commission is 200, return H+I+L
            if (rentalCommission === 200) {
              return rentalCommission + commission + addition
            }

            // Calculate days remaining in month from start date
            if (!startDate) {
              // If no start date, return simple sum
              return rentalCommission + commission + addition
            }

            try {
              const start = new Date(startDate)
              const year = start.getFullYear()
              const month = start.getMonth()
              
              // Get last day of month (EOMONTH equivalent)
              const lastDayOfMonth = new Date(year, month + 1, 0)
              const daysInMonth = lastDayOfMonth.getDate()
              
              // Get day of start date
              const dayOfStart = start.getDate()
              
              // Calculate days remaining in month (including start date)
              // DAY(EOMONTH(F3,0))-DAY(F3)+1
              const daysRemaining = daysInMonth - dayOfStart + 1
              
              // Calculate prorated rental commission + addition
              // (H+L) * days_remaining / days_in_month
              const proratedRentalAndAddition = (rentalCommission + addition) * (daysRemaining / daysInMonth)
              
              // Calculate commission
              // IF(I=38, I, I * days_remaining / days_in_month)
              let proratedCommission
              if (commission === 38) {
                proratedCommission = commission
              } else {
                proratedCommission = commission * (daysRemaining / daysInMonth)
              }
              
              // Total = prorated rental + addition + prorated commission
              return proratedRentalAndAddition + proratedCommission
            } catch (error) {
              console.error('Error calculating payment total:', error)
              // Fallback to simple sum
              return rentalCommission + commission + addition
            }
          }
          
          // Filter data yang start_date berada dalam selected range, lalu hitung total payment
          // Menggunakan logika yang sama dengan menu bank account rental
          // Data sudah difilter oleh API berdasarkan currency dan start_date, jadi langsung hitung saja
          const totalPayment = bankAccountResult.value.data.reduce((sum, row) => {
            const payment = calculatePaymentTotal(row)
            return sum + payment
          }, 0)
          
          setBankAccountRental(totalPayment)
        } else {
          setBankAccountRental(0)
        }
      } catch (error) {
        console.error('Error processing bank account rental data:', error)
        setBankAccountRental(0)
      }
      
      // Process W+ Account Output (WNLE Count)
      try {
        if (wnleResult.status === 'fulfilled' && wnleResult.value.success) {
          setWPlusAccountOutput(wnleResult.value.count || 0)
        } else {
          setWPlusAccountOutput(0)
        }
      } catch (error) {
        console.error('Error processing WNLE count data:', error)
        setWPlusAccountOutput(0)
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
      
      // All data loaded, set loading to false
      setIsLoadingDashboard(false)
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

  
  // Bank Summary data is now fetched from API (using state variables above)

  // Show loading state while data is being fetched
  if (isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

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
