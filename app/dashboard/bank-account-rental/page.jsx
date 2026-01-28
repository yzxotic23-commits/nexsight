'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useDashboardStore } from '@/lib/stores/dashboardStore'
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/utils/formatters'
import KPICard from '@/components/KPICard'
import ChartContainer from '@/components/ChartContainer'
import FilterBar from '@/components/FilterBar'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/toast-context'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, Search, Bell, HelpCircle, Settings, User, ChevronDown, Power, Filter, Plus, Trash2, Save, X, Eye, ChevronLeft, ChevronRight, CreditCard, DollarSign, Wallet } from 'lucide-react'
import Link from 'next/link'

// Custom Tooltip Component
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

export default function WealthAccountPage() {
  const { user: session } = useAuth()
  const { selectedMonth } = useFilterStore()
  const { wealthAccountData, setWealthAccountData } = useDashboardStore()
  const { showToast } = useToast()
  const [selectedMarket, setSelectedMarket] = useState('SGD')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [rowToDelete, setRowToDelete] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [rowToView, setRowToView] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const saveTimerRef = useRef(null)
  
  const tabs = ['SGD', 'MYR', 'USC']
  const itemsPerPageOptions = [10, 20, 50, 100, 200]

  // State for bank rent table data from Supabase
  const [bankRentData, setBankRentData] = useState([])
  const [loading, setLoading] = useState(true)

  // State for Bank Owner table
  const [bankOwnerData, setBankOwnerData] = useState([])
  const [bankOwnerLoading, setBankOwnerLoading] = useState(true)
  
  // State for selected month for Bank Owner table (default: current month)
  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
  const [selectedBankOwnerMonth, setSelectedBankOwnerMonth] = useState(getCurrentMonth())

  // Fetch bank price data from Supabase
  useEffect(() => {
    async function fetchBankPriceData() {
      setLoading(true)
      try {
        console.log('Fetching bank price data for currency:', selectedMarket)
        
        const response = await fetch(`/api/bank-price?currency=${selectedMarket}`)
        const result = await response.json()
        
        console.log('Bank price API response:', result)
        
        if (result.success) {
          // Map Supabase data to match component's expected format
          const mappedData = result.data.map(item => {
            const rowData = {
              id: item.id,
              supplier: item.supplier || 'WEALTH+',
              bankAccountName: item.bank_account_name || '',
              status: item.status || 'ACTIVE',
              department: item.department || '',
              sellOff: item.sell_off || '',
              startDate: item.start_date 
                ? (typeof item.start_date === 'string' 
                    ? item.start_date.split('T')[0] 
                    : item.start_date instanceof Date
                      ? item.start_date.toISOString().split('T')[0]
                      : item.start_date)
                : '',
              currency: item.currency || selectedMarket,
              rentalCommission: item.rental_commission ? parseFloat(item.rental_commission).toFixed(2) : '0.00',
              commission: item.commission ? parseFloat(item.commission).toFixed(2) : '0.00',
              markup: item.markup ? parseFloat(item.markup).toFixed(2) : '',
              sales: item.sales ? parseFloat(item.sales).toFixed(2) : '',
              addition: item.addition || '',
              remark: item.remark || '',
              paymentTotal: item.payment_total ? parseFloat(item.payment_total).toFixed(2) : '0.00',
              createdAt: item.created_at // Add created_at for sorting
            }
            // Recalculate payment total based on formula when loading data
            rowData.paymentTotal = calculatePaymentTotal(rowData)
            return rowData
          })
          
          // Sort by created_at DESC so newest rows appear at top
          mappedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          
          console.log(`Loaded ${mappedData.length} bank price records`)
          setBankRentData(mappedData)
        } else {
          showToast('Failed to load bank price data', 'error')
          setBankRentData([])
        }
      } catch (error) {
        console.error('Error fetching bank price data:', error)
        showToast('Error loading bank price data', 'error')
        setBankRentData([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchBankPriceData()
  }, [selectedMarket, showToast])

  // Fetch bank owner data from Supabase (only for SGD)
  useEffect(() => {
    // Only fetch if selectedMarket is SGD
    if (selectedMarket !== 'SGD') {
      setBankOwnerData([])
      setBankOwnerLoading(false)
      return
    }

    async function fetchBankOwnerData() {
      setBankOwnerLoading(true)
      try {
        console.log('Fetching bank owner data for month:', selectedBankOwnerMonth)
        
        const response = await fetch(`/api/bank-owner?month=${selectedBankOwnerMonth}`)
        const result = await response.json()
        
        console.log('Bank owner API response:', result)
        
        if (result.success) {
          if (result.data && result.data.length > 0) {
            // Map Supabase data to match component's expected format
            const mappedData = result.data.map(item => ({
              id: item.id,
              particular: item.particular || 'Bank Owner',
              dates: item.date_values || {},
              month: item.month,
              total: item.total || 0
            }))
            setBankOwnerData(mappedData)
          } else {
            // If no data exists, create default row
            setBankOwnerData([{
              id: null,
              particular: 'Bank Owner',
              dates: {},
              month: selectedBankOwnerMonth
            }])
          }
        } else {
          showToast('Failed to load bank owner data', 'error')
          setBankOwnerData([{
            id: null,
            particular: 'Bank Owner',
            dates: {},
            month: selectedBankOwnerMonth
          }])
        }
      } catch (error) {
        console.error('Error fetching bank owner data:', error)
        showToast('Error loading bank owner data', 'error')
        setBankOwnerData([{
          id: null,
          particular: 'Bank Owner',
          dates: {},
          month: selectedBankOwnerMonth
        }])
      } finally {
        setBankOwnerLoading(false)
      }
    }
    
    fetchBankOwnerData()
  }, [selectedBankOwnerMonth, selectedMarket, showToast])

  // Function to calculate payment total based on Excel formula
  // Formula: IF(E="OFF", H+I+L, IF(H=200, H+I+L, (H+L)*days_remaining/days_in_month + IF(I=38, I, I*days_remaining/days_in_month)))
  // E = Sell-OFF, F = Start date, H = Rental Commission, I = Commission, L = Addition
  const calculatePaymentTotal = (row) => {
    const sellOff = String(row.sellOff || '').toUpperCase().trim()
    const startDate = row.startDate
    const rentalCommission = parseFloat(String(row.rentalCommission || 0).replace(/,/g, '')) || 0
    const commission = parseFloat(String(row.commission || 0).replace(/,/g, '')) || 0
    const addition = parseFloat(String(row.addition || 0).replace(/,/g, '')) || 0

    // If Sell-OFF is "OFF", return H+I+L
    if (sellOff === 'OFF') {
      const total = rentalCommission + commission + addition
      return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    // If Rental Commission is 200, return H+I+L
    if (rentalCommission === 200) {
      const total = rentalCommission + commission + addition
      return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    // Calculate days remaining in month from start date
    if (!startDate) {
      // If no start date, return simple sum
      const total = rentalCommission + commission + addition
      return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
      const total = proratedRentalAndAddition + proratedCommission
      
      return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    } catch (error) {
      console.error('Error calculating payment total:', error)
      // Fallback to simple sum
      const total = rentalCommission + commission + addition
      return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  }

  // Function to add new row
  const addNewRow = async () => {
    try {
      // Get current date in YYYY-MM-DD format for date input
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const startDate = `${year}-${month}-${day}`
      
      const newRow = {
        supplier: 'WEALTH+',
        bank_account_name: '',
        status: 'ACTIVE',
        department: selectedMarket === 'SGD' ? 'NP_INT_SGD' : selectedMarket === 'MYR' ? 'NP_INT_MYR' : 'NP_INT_USC',
        sell_off: '',
        start_date: startDate, // Auto-generated from current date (YYYY-MM-DD format)
        currency: selectedMarket,
        rental_commission: 0.00,
        commission: 0.00,
        markup: null,
        sales: null,
        addition: '',
        remark: '',
        created_by: session?.name || 'System',
        updated_by: session?.name || 'System'
      }

      const response = await fetch('/api/bank-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow)
      })

      const result = await response.json()

      if (result.success) {
        showToast('New row added successfully', 'success')
        // Refresh data
        const fetchResponse = await fetch(`/api/bank-price?currency=${selectedMarket}`)
        const fetchResult = await fetchResponse.json()
        
        if (fetchResult.success) {
          const mappedData = fetchResult.data.map(item => ({
            id: item.id,
            supplier: item.supplier || 'WEALTH+',
            bankAccountName: item.bank_account_name || '',
            status: item.status || 'ACTIVE',
            department: item.department || '',
            sellOff: item.sell_off || '',
            startDate: item.start_date 
              ? (typeof item.start_date === 'string' 
                  ? item.start_date.split('T')[0] 
                  : item.start_date instanceof Date
                    ? item.start_date.toISOString().split('T')[0]
                    : item.start_date)
              : '',
            currency: item.currency || selectedMarket,
            rentalCommission: item.rental_commission ? parseFloat(item.rental_commission).toFixed(2) : '0.00',
            commission: item.commission ? parseFloat(item.commission).toFixed(2) : '0.00',
            markup: item.markup ? parseFloat(item.markup).toFixed(2) : '',
            sales: item.sales ? parseFloat(item.sales).toFixed(2) : '',
            addition: item.addition || '',
            remark: item.remark || '',
            paymentTotal: item.payment_total ? parseFloat(item.payment_total).toFixed(2) : '0.00',
            createdAt: item.created_at // Add created_at for sorting
          }))
          // Sort by created_at DESC so newest rows appear at top
          mappedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          setBankRentData(mappedData)
        }
      } else {
        showToast('Failed to add new row', 'error')
      }
    } catch (error) {
      console.error('Error adding new row:', error)
      showToast('Error adding new row', 'error')
    }
  }

  // Function to open delete confirmation modal
  const openDeleteModal = (id) => {
    const row = bankRentData.find(r => r.id === id)
    setRowToDelete(row)
    setIsDeleteModalOpen(true)
  }

  // Function to open detail modal
  const openDetailModal = (row) => {
    setRowToView(row)
    setIsDetailModalOpen(true)
  }

  // Reset to page 1 if current page exceeds total pages after data changes or market changes
  useEffect(() => {
    const filteredData = bankRentData.filter(row => row.currency === selectedMarket)
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    } else if (totalPages === 0) {
      setCurrentPage(1)
    }
  }, [bankRentData.length, currentPage, itemsPerPage, selectedMarket])

  // Function to delete row after confirmation
  const confirmDelete = async () => {
    if (rowToDelete) {
      try {
        const response = await fetch(`/api/bank-price?id=${rowToDelete.id}`, {
          method: 'DELETE'
        })

        const result = await response.json()

        if (result.success) {
          showToast('Row deleted successfully', 'success')
          // Refresh data
          const fetchResponse = await fetch(`/api/bank-price?currency=${selectedMarket}`)
          const fetchResult = await fetchResponse.json()
          
          if (fetchResult.success) {
            const mappedData = fetchResult.data.map(item => {
              const rowData = {
                id: item.id,
                supplier: item.supplier || 'WEALTH+',
                bankAccountName: item.bank_account_name || '',
                status: item.status || 'ACTIVE',
                department: item.department || '',
                sellOff: item.sell_off || '',
                startDate: item.start_date 
                  ? (typeof item.start_date === 'string' 
                      ? item.start_date.split('T')[0] 
                      : item.start_date instanceof Date
                        ? item.start_date.toISOString().split('T')[0]
                        : item.start_date)
                  : '',
                currency: item.currency || selectedMarket,
                rentalCommission: item.rental_commission ? parseFloat(item.rental_commission).toFixed(2) : '0.00',
                commission: item.commission ? parseFloat(item.commission).toFixed(2) : '0.00',
                markup: item.markup ? parseFloat(item.markup).toFixed(2) : '',
                sales: item.sales ? parseFloat(item.sales).toFixed(2) : '',
                addition: item.addition || '',
                remark: item.remark || '',
                paymentTotal: item.payment_total ? parseFloat(item.payment_total).toFixed(2) : '0.00',
                createdAt: item.created_at
              }
              // Recalculate payment total based on formula when loading data
              rowData.paymentTotal = calculatePaymentTotal(rowData)
              return rowData
            })
            // Sort by created_at DESC
            mappedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            setBankRentData(mappedData)
          }
        } else {
          showToast('Failed to delete row', 'error')
        }
      } catch (error) {
        console.error('Error deleting row:', error)
        showToast('Error deleting row', 'error')
      } finally {
        setIsDeleteModalOpen(false)
        setRowToDelete(null)
      }
    }
  }

  // Function to save row to database
  const saveRow = async (row) => {
    try {
      const updateData = {
        id: row.id,
        supplier: row.supplier,
        bank_account_name: row.bankAccountName,
        status: row.status,
        department: row.department,
        sell_off: row.sellOff,
        start_date: row.startDate,
        currency: row.currency,
        rental_commission: parseFloat(String(row.rentalCommission).replace(/,/g, '')) || 0,
        commission: parseFloat(String(row.commission).replace(/,/g, '')) || 0,
        markup: row.markup ? parseFloat(String(row.markup).replace(/,/g, '')) : null,
        sales: row.sales ? parseFloat(String(row.sales).replace(/,/g, '')) : null,
        addition: row.addition,
        remark: row.remark,
        updated_by: session?.name || 'System'
      }

      const response = await fetch('/api/bank-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        showToast('Row saved successfully', 'success')
        // Refresh data
        const fetchResponse = await fetch(`/api/bank-price?currency=${selectedMarket}`)
        const fetchResult = await fetchResponse.json()
        
        if (fetchResult.success) {
          const mappedData = fetchResult.data.map(item => {
            const rowData = {
              id: item.id,
              supplier: item.supplier || 'WEALTH+',
              bankAccountName: item.bank_account_name || '',
              status: item.status || 'ACTIVE',
              department: item.department || '',
              sellOff: item.sell_off || '',
              startDate: item.start_date 
                ? (typeof item.start_date === 'string' 
                    ? item.start_date.split('T')[0] 
                    : item.start_date instanceof Date
                      ? item.start_date.toISOString().split('T')[0]
                      : item.start_date)
                : '',
              currency: item.currency || selectedMarket,
              rentalCommission: item.rental_commission ? parseFloat(item.rental_commission).toFixed(2) : '0.00',
              commission: item.commission ? parseFloat(item.commission).toFixed(2) : '0.00',
              markup: item.markup ? parseFloat(item.markup).toFixed(2) : '',
              sales: item.sales ? parseFloat(item.sales).toFixed(2) : '',
              addition: item.addition || '',
              remark: item.remark || '',
              paymentTotal: item.payment_total ? parseFloat(item.payment_total).toFixed(2) : '0.00',
              createdAt: item.created_at
            }
            // Recalculate payment total based on formula when loading data
            rowData.paymentTotal = calculatePaymentTotal(rowData)
            return rowData
          })
          // Sort by created_at DESC
          mappedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          setBankRentData(mappedData)
        }
      } else {
        showToast('Failed to save row', 'error')
      }
    } catch (error) {
      showToast('Failed to save row', 'error')
      console.error('Error saving row:', error)
    }
  }

  // Function to update cell value
  const updateCell = (id, field, value) => {
    setBankRentData(bankRentData.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value }
        // Auto calculate payment total when any relevant field changes
        if (field === 'rentalCommission' || field === 'commission' || field === 'addition' || 
            field === 'sellOff' || field === 'startDate') {
          updated.paymentTotal = calculatePaymentTotal(updated)
        }
        return updated
      }
      return row
    }))
  }

  // Function to get days in selected month
  const getDaysInMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number)
    return new Date(year, month, 0).getDate()
  }

  // Function to generate date headers (01 Jan, 02 Jan, etc.)
  const generateDateHeaders = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number)
    const daysInMonth = getDaysInMonth(yearMonth)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthName = monthNames[month - 1]
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0')
      return {
        key: `${day}-${monthName}`,
        label: `${day} ${monthName}`
      }
    })
  }

  // Function to calculate total for Bank Owner row
  const calculateBankOwnerTotal = (row) => {
    const dateHeaders = generateDateHeaders(selectedBankOwnerMonth)
    let total = 0
    
    dateHeaders.forEach(dateHeader => {
      const value = row.dates[dateHeader.key] || ''
      if (value && value !== '-') {
        const numValue = parseFloat(String(value).replace(/,/g, '')) || 0
        total += numValue
      }
    })
    
    // Format with 2 decimal places
    return total.toFixed(2)
  }

  // Function to save Bank Owner data to Supabase (upsert)
  const saveBankOwnerData = async (row) => {
    try {
      const saveData = {
        particular: row.particular || 'Bank Owner',
        month: selectedBankOwnerMonth,
        currency: 'SGD', // Always SGD for Bank Owner
        date_values: row.dates || {},
        updated_by: session?.name || 'System'
      }

      // If row has id, include it for update, otherwise it will be created
      if (row.id) {
        saveData.id = row.id
      } else {
        saveData.created_by = session?.name || 'System'
      }

      // Use POST with upsert (handles both insert and update)
      const response = await fetch('/api/bank-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      })

      const result = await response.json()

      if (result.success) {
        // Update local state with saved data
        setBankOwnerData(prevData => prevData.map(r => {
          if (r.id === row.id || (!r.id && !row.id)) {
            return {
              id: result.data.id,
              particular: result.data.particular,
              dates: result.data.date_values || {},
              month: result.data.month,
              total: result.data.total || 0
            }
          }
          return r
        }))
        return true
      } else {
        showToast('Failed to save bank owner data', 'error')
        return false
      }
    } catch (error) {
      console.error('Error saving bank owner data:', error)
      showToast('Error saving bank owner data', 'error')
      return false
    }
  }

  // Function to update Bank Owner cell value (with auto-save)
  const updateBankOwnerCell = (id, dateKey, value) => {
    // Update local state immediately for responsive UI
    setBankOwnerData(prevData => {
      const updatedData = prevData.map(row => {
        // Match by id, or if id is null, match the first row without id
        if (row.id === id || (id === null && !row.id)) {
          return { ...row, dates: { ...row.dates, [dateKey]: value } }
        }
        return row
      })
      
      // Clear previous timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      
      // Save to Supabase after 1 second of no changes
      const rowToSave = updatedData.find(r => r.id === id || (id === null && !r.id))
      if (rowToSave) {
        saveTimerRef.current = setTimeout(() => {
          saveBankOwnerData(rowToSave)
        }, 1000)
      }
      
      return updatedData
    })
  }

  // Function to update Bank Owner particular (with auto-save)
  const updateBankOwnerParticular = (id, value) => {
    // Update local state immediately
    setBankOwnerData(prevData => {
      const updatedData = prevData.map(row => {
        // Match by id, or if id is null, match the first row without id
        if (row.id === id || (id === null && !row.id)) {
          return { ...row, particular: value }
        }
        return row
      })
      
      // Clear previous timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      
      // Save to Supabase after 1 second of no changes
      const rowToSave = updatedData.find(r => r.id === id || (id === null && !r.id))
      if (rowToSave) {
        saveTimerRef.current = setTimeout(() => {
          saveBankOwnerData(rowToSave)
        }, 1000)
      }
      
      return updatedData
    })
  }

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

  // Calculate KPI metrics from bankRentData filtered by selectedMarket
  const calculateKPIs = (market) => {
    const filteredData = bankRentData.filter(row => row.currency === market)
    const totalAccounts = filteredData.length
    const activeAccounts = filteredData.filter(row => row.status === 'ACTIVE').length
    const totalPayment = filteredData.reduce((sum, row) => {
      const payment = parseFloat(String(row.paymentTotal).replace(/,/g, '')) || 0
      return sum + payment
    }, 0)
    const totalSales = filteredData.reduce((sum, row) => {
      const sales = parseFloat(String(row.sales).replace(/,/g, '')) || 0
      return sum + sales
    }, 0)
    
    return {
      totalAccounts,
      activeAccounts,
      totalPayment,
      totalSales
    }
  }

  // Get filtered data for current market
  const filteredBankRentData = bankRentData.filter(row => row.currency === selectedMarket)
  const kpis = calculateKPIs(selectedMarket)

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading bank price data...</p>
        </div>
      </div>
    )
  }

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

      {/* Table Section - Show for all tabs */}
      <div className="mt-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <KPICard
            title="Total Accounts"
            value={formatNumber(kpis.totalAccounts)}
            change={0}
            icon={CreditCard}
            trend="up"
          />
          <KPICard
            title="Active Accounts"
            value={formatNumber(kpis.activeAccounts)}
            change={kpis.totalAccounts > 0 ? ((kpis.activeAccounts / kpis.totalAccounts) * 100) : 0}
            icon={Wallet}
            trend="up"
          />
          <KPICard
            title="Total Payment"
            value={formatCurrency(kpis.totalPayment, selectedMarket)}
            change={0}
            icon={DollarSign}
            trend="up"
          />
        </div>
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-gray-900 overflow-hidden">
            {/* Table Header with Title and Add Button */}
            <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-900">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Price</h2>
              <button
                onClick={addNewRow}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-gray-900 rounded-xl transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900">
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>SUPPLIER</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>BANK ACCOUNT NAME</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>STATUS</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>DEPARTMENT</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>SELL-OFF</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>START DATE</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>CURRENCY</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>RENTAL COMMISSION</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>COMMISSION</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>MARKUP</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>SALES</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
              <div className="flex items-center justify-between">
                        <span>ADDITION</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
              </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
              <div className="flex items-center justify-between">
                        <span>REMARK</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
              </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
              <div className="flex items-center justify-between">
                        <span>PAYMENT TOTAL</span>
                          <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider" style={{ minWidth: '120px' }}>
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-card">
                  {(() => {
                    // Calculate pagination for filtered data
                    const totalPages = Math.ceil(filteredBankRentData.length / itemsPerPage)
                    const startIndex = (currentPage - 1) * itemsPerPage
                    const endIndex = startIndex + itemsPerPage
                    const paginatedData = filteredBankRentData.slice(startIndex, endIndex)
                    
                    // Show "no data" message if filtered data is empty
                    if (filteredBankRentData.length === 0) {
                      return (
                        <tr>
                          <td colSpan={15} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No Data Available</p>
                              <p className="text-sm text-gray-400 dark:text-gray-500">There are no bank accounts for {selectedMarket} currency.</p>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                    
                    return paginatedData.map((row, index) => (
                    <tr 
                      key={row.id} 
                      className={`group transition-colors duration-150 ${
                        index % 2 === 0 
                          ? 'bg-white dark:bg-dark-card' 
                          : 'bg-gray-50/50 dark:bg-gray-900/50'
                      } hover:bg-gray-100 dark:hover:bg-gray-800/50`}
                    >
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.supplier}
                          onChange={(e) => updateCell(row.id, 'supplier', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.bankAccountName}
                          onChange={(e) => updateCell(row.id, 'bankAccountName', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.status}
                          onChange={(e) => updateCell(row.id, 'status', e.target.value)}
                          className={`w-full px-2 py-1.5 text-sm font-medium rounded transition-all focus:outline-none focus:border-2 focus:border-gold-500 ${
                            row.status === 'ACTIVE' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : row.status === 'SUSPEND'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : row.status === 'INACTIVE'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-transparent text-gray-900 dark:text-white focus:bg-gray-50 dark:focus:bg-gray-800'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.department}
                          onChange={(e) => updateCell(row.id, 'department', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.sellOff}
                          onChange={(e) => updateCell(row.id, 'sellOff', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          type="date"
                          value={row.startDate ? (typeof row.startDate === 'string' && row.startDate.includes('T') ? row.startDate.split('T')[0] : row.startDate) : ''}
                          onChange={(e) => updateCell(row.id, 'startDate', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.currency}
                          onChange={(e) => updateCell(row.id, 'currency', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.rentalCommission}
                          onChange={(e) => updateCell(row.id, 'rentalCommission', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all text-right"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.commission}
                          onChange={(e) => updateCell(row.id, 'commission', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all text-right"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.markup}
                          onChange={(e) => updateCell(row.id, 'markup', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all text-right"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.sales}
                          onChange={(e) => updateCell(row.id, 'sales', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all text-right"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.addition}
                          onChange={(e) => updateCell(row.id, 'addition', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all text-right"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <input
                          type="text"
                          value={row.remark}
                          onChange={(e) => updateCell(row.id, 'remark', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                        <input
                          type="text"
                          value={row.paymentTotal}
                          onChange={(e) => updateCell(row.id, 'paymentTotal', e.target.value)}
                          onFocus={(e) => {
                            // Store original value when focusing
                            e.target.dataset.originalValue = row.paymentTotal
                          }}
                          onBlur={(e) => {
                            // If user didn't change the value, recalculate based on formula
                            if (e.target.value === e.target.dataset.originalValue) {
                              const currentRow = bankRentData.find(r => r.id === row.id)
                              if (currentRow) {
                                const calculated = calculatePaymentTotal(currentRow)
                                updateCell(row.id, 'paymentTotal', calculated)
                              }
                            }
                          }}
                          className="w-full px-2 py-1.5 text-sm font-semibold text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all text-right"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailModal(row)}
                            className="flex items-center justify-center w-9 h-9 text-blue-500 hover:text-white hover:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => saveRow(row)}
                            className="flex items-center justify-center w-9 h-9 text-green-500 hover:text-white hover:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                            title="Save row"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(row.id)}
                            className="flex items-center justify-center w-9 h-9 text-red-500 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 opacity-0 group-hover:opacity-100"
                            title="Delete row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  })()}
                </tbody>
              </table>
              
              {/* Pagination */}
              {(() => {
                const totalPages = Math.ceil(filteredBankRentData.length / itemsPerPage)
                if (totalPages <= 1) return null
                
                return (
                  <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBankRentData.length)} of {filteredBankRentData.length} entries
                      </div>
                      
                      {/* Items Per Page Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value))
                            setCurrentPage(1)
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                        >
                          {itemsPerPageOptions.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center justify-center w-9 h-9 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === page
                                    ? 'bg-gold-500 text-gray-900'
                                    : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-gray-600 dark:text-gray-400">
                                ...
                </span>
                            )
                          }
                          return null
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center justify-center w-9 h-9 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })()}
              </div>
            </div>
          </div>

          {/* Bank Owner Table - Only for SGD */}
          {selectedMarket === 'SGD' && (
          <div className="mt-8 bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-gray-900 overflow-hidden">
            {/* Table Header with Title and Month Dropdown */}
            <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-900">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Owner</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400">Month:</label>
                <input
                  type="month"
                  value={selectedBankOwnerMonth}
                  onChange={(e) => setSelectedBankOwnerMonth(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900">
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-between">
                        <span>PARTICULAR</span>
                        <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-gray-200 transition-colors text-white" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white">
                      <div className="flex items-center justify-center">
                        <span>TOTAL</span>
                      </div>
                    </th>
                    {generateDateHeaders(selectedBankOwnerMonth).map((dateHeader) => (
                      <th 
                        key={dateHeader.key}
                        className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white dark:border-white"
                      >
                        {dateHeader.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-card">
                  {bankOwnerLoading ? (
                    <tr>
                      <td colSpan={generateDateHeaders(selectedBankOwnerMonth).length + 2} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading bank owner data...</p>
                        </div>
                      </td>
                    </tr>
                  ) : bankOwnerData.length === 0 ? (
                    <tr>
                      <td colSpan={generateDateHeaders(selectedBankOwnerMonth).length + 2} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No Data Available</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">No bank owner data for this month.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    bankOwnerData.map((row, index) => {
                      const total = calculateBankOwnerTotal(row)
                      return (
                        <tr 
                          key={row.id || `new-${index}`} 
                          className={`group transition-colors duration-150 ${
                            index % 2 === 0 
                              ? 'bg-white dark:bg-dark-card' 
                              : 'bg-gray-50/50 dark:bg-gray-900/50'
                          } hover:bg-gray-100 dark:hover:bg-gray-800/50`}
                        >
                        <td className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                          <input
                            type="text"
                            value={row.particular}
                            onChange={(e) => updateBankOwnerParticular(row.id || null, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all"
                          />
                        </td>
                        <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                          <input
                            type="text"
                            value={total}
                            readOnly
                            className="w-full px-2 py-1.5 text-sm font-semibold text-green-600 dark:text-green-400 bg-transparent focus:outline-none cursor-not-allowed text-right"
                          />
                        </td>
                        {generateDateHeaders(selectedBankOwnerMonth).map((dateHeader) => (
                          <td key={dateHeader.key} className="px-4 py-3 border border-gray-200 dark:border-gray-800">
                            <input
                              type="text"
                              value={row.dates[dateHeader.key] || ''}
                              onChange={(e) => updateBankOwnerCell(row.id || null, dateHeader.key, e.target.value)}
                              placeholder="-"
                              className="w-full px-2 py-1.5 text-sm text-gray-900 dark:text-white bg-transparent border border-transparent focus:outline-none focus:border-2 focus:border-gold-500 focus:bg-gray-50 dark:focus:bg-gray-800 rounded transition-all text-right"
                            />
                          </td>
                        ))}
                      </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && rowToDelete && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[9999] flex items-center justify-center p-4"
          onClick={() => {
            setIsDeleteModalOpen(false)
            setRowToDelete(null)
          }}
        >
          <div 
            className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-900 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Row</h2>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setRowToDelete(null)
                }}
                className="p-2 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete this row?
              </p>
              <div className="bg-gray-50 dark:bg-black rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">Bank Account:</span> {rowToDelete.bankAccountName || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">Supplier:</span> {rowToDelete.supplier || 'N/A'}
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                This action cannot be undone. All data will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setRowToDelete(null)
                }}
                className="flex-1 px-6 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Delete Row
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Detail View Modal */}
      {isDetailModalOpen && rowToView && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[9999] flex items-center justify-center p-4"
          onClick={() => {
            setIsDetailModalOpen(false)
            setRowToView(null)
          }}
        >
          <div 
            className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Row Details</h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setRowToView(null)
                }}
                className="p-2 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Supplier</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.supplier || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Bank Account Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.bankAccountName || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.status || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Department</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.department || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Sell-Off</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.sellOff || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Start Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {rowToView.startDate 
                      ? (typeof rowToView.startDate === 'string' 
                          ? new Date(rowToView.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : rowToView.startDate)
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Currency</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.currency || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Rental Commission</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.rentalCommission || '0.00'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Commission</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.commission || '0.00'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Markup</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.markup || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Sales</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.sales || '0.00'}</p>
              </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Addition</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.addition || 'N/A'}</p>
              </div>
                <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Payment Total</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{rowToView.paymentTotal || '0.00'}</p>
              </div>
            </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Remark</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{rowToView.remark || 'N/A'}</p>
          </div>
        </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setRowToView(null)
                }}
                className="px-6 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors"
              >
                Close
              </button>
      </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
