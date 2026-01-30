import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    // Parse dates - use date string directly to avoid timezone issues
    // startDate and endDate are in format YYYY-MM-DD
    // For database query, we need to ensure we're querying the full day range
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Calculate start and end of month in local timezone
    const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0)
    const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
    
    // For database queries, use date-only format (YYYY-MM-DD) to avoid timezone conversion issues
    // Supabase will compare dates correctly regardless of timezone
    const startOfMonthStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`
    const endOfMonthStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`
    
    // Also keep ISO format for comparison
    const startOfMonthISO = startOfMonth.toISOString()
    const endOfMonthISO = endOfMonth.toISOString()
    
    console.log('Date range calculation:', {
      startDate,
      endDate,
      startOfMonthStr,
      endOfMonthStr,
      startOfMonthISO,
      endOfMonthISO,
      localStart: startOfMonth.toString(),
      localEnd: endOfMonth.toString()
    })
    
    // Previous month for comparison
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1)
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999)

    // Format month label for label matching (e.g., "jan-2026", "jan2026", "january-2026")
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const monthIndex = start.getMonth()
    const year = start.getFullYear()
    const monthLabel = `${monthNames[monthIndex]}-${year}` // e.g., "jan-2026"
    const monthLabelAlt1 = `${monthNames[monthIndex]}${year}` // e.g., "jan2026"
    const monthLabelAlt2 = `${monthNames[monthIndex]}-${year.toString().slice(-2)}` // e.g., "jan-26"
    
    console.log('Month label:', monthLabel, 'Date range:', startOfMonth.toISOString(), 'to', endOfMonth.toISOString())
    
    // Helper function to filter by month label only (removed wealths+ filter)
    const filterByMonthLabel = (items) => {
      if (!items || items.length === 0) {
        console.log('No items to filter')
        return []
      }
      
      const filtered = items.filter(item => {
        const labels = Array.isArray(item.labels) ? item.labels : (typeof item.labels === 'string' ? [item.labels] : [])
        
        if (labels.length === 0) {
          return false
        }
        
        // Only check for month label (removed wealths+ filter)
        const hasMonthLabel = labels.some(label => {
          const labelStr = typeof label === 'string' ? label.toLowerCase() : String(label).toLowerCase()
          return labelStr.includes(monthLabel) || 
                 labelStr.includes(monthLabelAlt1) || 
                 labelStr.includes(monthLabelAlt2) ||
                 labelStr.includes(monthNames[monthIndex])
        })
        
        return hasMonthLabel
      })
      
      console.log(`Filtered ${filtered.length} items from ${items.length} total items by month label only`)
      
      return filtered
    }

    // 1. Total Rented Accounts: project_key = 'WEO' AND label contains 'wealths+' AND month label
    // First, let's check if there's any WEO data at all
    const { data: allWEOData, error: allWEOError } = await supabaseServer
      .from('jira_issues')
      .select('id, labels, created_at, project_key')
      .eq('project_key', 'WEO')
      .limit(5)

    console.log('Sample WEO data (first 5):', JSON.stringify(allWEOData, null, 2))
    
    // First, get all WEO data without date filter to see total count
    const { data: allWEOWithoutFilter, error: allWEOWithoutFilterError } = await supabaseServer
      .from('jira_issues')
      .select('id, contract_start_date_weo')
      .eq('project_key', 'WEO')
    
    console.log(`Total WEO records in database: ${allWEOWithoutFilter?.length || 0}`)
    
    const { data: allRentedAccounts, error: rentedError } = await supabaseServer
      .from('jira_issues')
      .select('id, labels, contract_start_date_weo')
      .eq('project_key', 'WEO')
      .gte('contract_start_date_weo', startOfMonthISO)
      .lte('contract_start_date_weo', endOfMonthISO)
    
    // Also check if there are records with null contract_start_date_weo that should be included
    const { data: nullStartDateRecords, error: nullError } = await supabaseServer
      .from('jira_issues')
      .select('id, labels, contract_start_date_weo')
      .eq('project_key', 'WEO')
      .is('contract_start_date_weo', null)
    
    console.log(`WEO records with null contract_start_date_weo: ${nullStartDateRecords?.length || 0}`)

    if (rentedError) {
      console.error('Error fetching rented accounts:', rentedError)
    }

    console.log(`Fetched ${allRentedAccounts?.length || 0} WEO accounts for the month`)
    console.log('Date range (contract_start_date_weo):', startOfMonthISO, 'to', endOfMonthISO)
    
    // Log sample dates to see what's being filtered
    if (allRentedAccounts && allRentedAccounts.length > 0) {
      const sampleDates = allRentedAccounts.slice(0, 5).map(item => ({
        id: item.id,
        contract_start_date_weo: item.contract_start_date_weo
      }))
      console.log('Sample contract_start_date_weo from filtered results:', sampleDates)
    }
    
    // Check if there are records just outside the range
    const dayBeforeStart = new Date(startOfMonth)
    dayBeforeStart.setDate(dayBeforeStart.getDate() - 1)
    const dayAfterEnd = new Date(endOfMonth)
    dayAfterEnd.setDate(dayAfterEnd.getDate() + 1)
    
    const { data: justOutsideRange, error: outsideError } = await supabaseServer
      .from('jira_issues')
      .select('id, contract_start_date_weo, labels')
      .eq('project_key', 'WEO')
      .or(`contract_start_date_weo.lte.${dayBeforeStart.toISOString()},contract_start_date_weo.gte.${dayAfterEnd.toISOString()}`)
      .limit(10)
    
    console.log(`WEO records just outside date range: ${justOutsideRange?.length || 0}`)
    if (justOutsideRange && justOutsideRange.length > 0) {
      console.log('Sample records outside range:', justOutsideRange.slice(0, 3).map(item => ({
        id: item.id,
        contract_start_date_weo: item.contract_start_date_weo,
        labels: item.labels
      })))
    }
    
    if (allRentedAccounts && allRentedAccounts.length > 0) {
      console.log('Sample labels from first 3 items:', allRentedAccounts.slice(0, 3).map(item => ({
        labels: item.labels,
        labelsType: typeof item.labels,
        isArray: Array.isArray(item.labels),
        contract_start_date_weo: item.contract_start_date_weo
      })))
    }
    
    const rentedAccounts = filterByMonthLabel(allRentedAccounts)
    console.log(`After filtering by month label: ${rentedAccounts?.length || 0} rented accounts`)

    // 2. Total Rented Amount: sum of (total_rental_amount_weo + total_commission_amount_weo)
    const { data: rentedAmountDataRaw, error: rentedAmountError } = await supabaseServer
      .from('jira_issues')
      .select('total_rental_amount_weo, total_commission_amount_weo, labels, contract_start_date_weo')
      .eq('project_key', 'WEO')
      .gte('contract_start_date_weo', startOfMonthISO)
      .lte('contract_start_date_weo', endOfMonthISO)

    if (rentedAmountError) {
      console.error('Error fetching rented amount:', rentedAmountError)
    }

    const rentedAmountData = filterByMonthLabel(rentedAmountDataRaw)
    const totalRentedAmount = rentedAmountData?.reduce((sum, item) => {
      const rentalAmount = parseFloat(item.total_rental_amount_weo) || 0
      const commissionAmount = parseFloat(item.total_commission_amount_weo) || 0
      return sum + rentalAmount + commissionAmount
    }, 0) || 0

    // 3. Total Sales Quantity: WEO tasks with month label (same as Total Rented Accounts)
    const { data: salesQuantityDataRaw, error: salesQuantityError } = await supabaseServer
      .from('jira_issues')
      .select('id, labels')
      .eq('project_key', 'WEO')
      .gte('contract_start_date_weo', startOfMonthISO)
      .lte('contract_start_date_weo', endOfMonthISO)

    if (salesQuantityError) {
      console.error('Error fetching sales quantity:', salesQuantityError)
    }

    const salesQuantityData = filterByMonthLabel(salesQuantityDataRaw)

    // 4. Total Sales Amount: selling_price_weo - (total_rental_amount_weo + total_commission_amount_weo)
    const { data: salesAmountDataRaw, error: salesAmountError } = await supabaseServer
      .from('jira_issues')
      .select('contract_start_date_weo, selling_price_weo, total_rental_amount_weo, total_commission_amount_weo, labels')
      .eq('project_key', 'WEO')
      .gte('contract_start_date_weo', startOfMonthISO)
      .lte('contract_start_date_weo', endOfMonthISO)
      .not('selling_price_weo', 'is', null)

    if (salesAmountError) {
      console.error('Error fetching sales amount:', salesAmountError)
    }

    const salesAmountData = filterByMonthLabel(salesAmountDataRaw)
    const totalSalesAmount = salesAmountData?.reduce((sum, item) => {
      const sellingPrice = parseFloat(item.selling_price_weo) || 0
      const rentalAmount = parseFloat(item.total_rental_amount_weo) || 0
      const commissionAmount = parseFloat(item.total_commission_amount_weo) || 0
      return sum + (sellingPrice - rentalAmount - commissionAmount)
    }, 0) || 0

    // 5. Total Account Created: WEO tasks only created in the month
    const { data: accountCreatedData, error: accountCreatedError } = await supabaseServer
      .from('jira_issues')
      .select('id, created_at')
      .eq('project_key', 'WEO')
      .gte('created_at', startOfMonthISO)
      .lte('created_at', endOfMonthISO)

    if (accountCreatedError) {
      console.error('Error fetching account created:', accountCreatedError)
    }

    // Previous month account created for growth rate (WEO only)
    const prevStartISOForAccount = prevStart.toISOString()
    const prevEndISOForAccount = prevEnd.toISOString()
    const { data: prevAccountCreatedData, error: prevAccountError } = await supabaseServer
      .from('jira_issues')
      .select('id')
      .eq('project_key', 'WEO')
      .gte('created_at', prevStartISOForAccount)
      .lte('created_at', prevEndISOForAccount)

    if (prevAccountError) {
      console.error('Error fetching previous month account created:', prevAccountError)
    }

    const totalAccountCreated = accountCreatedData?.length || 0
    const prevMonthAccountCreated = prevAccountCreatedData?.length || 0
    const growthRate = prevMonthAccountCreated > 0 
      ? ((totalAccountCreated - prevMonthAccountCreated) / prevMonthAccountCreated) * 100 
      : 0

    // 6. Daily Account Creation: group by created_at date
    const dailyAccountCreation = {}
    accountCreatedData?.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      dailyAccountCreation[date] = (dailyAccountCreation[date] || 0) + 1
    })

    // 7. Rental Trend: daily rental amount over the month (total_rental_amount_weo + total_commission_amount_weo)
    const { data: allRentalTrendData, error: rentalTrendError } = await supabaseServer
      .from('jira_issues')
      .select('contract_start_date_weo, total_rental_amount_weo, total_commission_amount_weo, labels')
      .eq('project_key', 'WEO')
      .gte('contract_start_date_weo', startOfMonthISO)
      .lte('contract_start_date_weo', endOfMonthISO)

    if (rentalTrendError) {
      console.error('Error fetching rental trend:', rentalTrendError)
    }

    const rentalTrendData = filterByMonthLabel(allRentalTrendData)
    const rentalTrend = {}
    rentalTrendData?.forEach(item => {
      const date = new Date(item.contract_start_date_weo).toISOString().split('T')[0]
      const rentalAmount = parseFloat(item.total_rental_amount_weo) || 0
      const commissionAmount = parseFloat(item.total_commission_amount_weo) || 0
      rentalTrend[date] = (rentalTrend[date] || 0) + rentalAmount + commissionAmount
    })

    // 8. Sales Trend: daily sales amount over the month (already filtered by month label)
    const salesTrend = {}
    salesAmountData?.forEach(item => {
      const date = new Date(item.contract_start_date_weo).toISOString().split('T')[0]
      const sellingPrice = parseFloat(item.selling_price_weo) || 0
      const rentalAmount = parseFloat(item.total_rental_amount_weo) || 0
      const commissionAmount = parseFloat(item.total_commission_amount_weo) || 0
      const salesAmount = sellingPrice - rentalAmount - commissionAmount
      salesTrend[date] = (salesTrend[date] || 0) + salesAmount
    })

    // 9. Usage Volume Trend: daily count of accounts used
    const { data: usageVolumeData, error: usageVolumeError } = await supabaseServer
      .from('jira_issues')
      .select('contract_start_date_weo')
      .eq('project_key', 'WEO')
      .gte('contract_start_date_weo', startOfMonthISO)
      .lte('contract_start_date_weo', endOfMonthISO)

    if (usageVolumeError) {
      console.error('Error fetching usage volume:', usageVolumeError)
    }

    const usageVolumeTrend = {}
    usageVolumeData?.forEach(item => {
      const date = new Date(item.contract_start_date_weo).toISOString().split('T')[0]
      usageVolumeTrend[date] = (usageVolumeTrend[date] || 0) + 1
    })

    // Previous month rented accounts for rental trend
    const prevStartISOForRented = prevStart.toISOString()
    const prevEndISOForRented = prevEnd.toISOString()
    const { data: prevRentedAccountsRaw, error: prevRentedError } = await supabaseServer
      .from('jira_issues')
      .select('id, labels')
      .eq('project_key', 'WEO')
      .gte('contract_start_date_weo', prevStartISOForRented)
      .lte('contract_start_date_weo', prevEndISOForRented)

    if (prevRentedError) {
      console.error('Error fetching previous month rented accounts:', prevRentedError)
    }

    // Calculate previous month label for filtering
    const prevMonthIndex = prevStart.getMonth()
    const prevYear = prevStart.getFullYear()
    const prevMonthLabel = `${monthNames[prevMonthIndex]}-${prevYear}`
    const prevMonthLabelAlt1 = `${monthNames[prevMonthIndex]}${prevYear}`
    const prevMonthLabelAlt2 = `${monthNames[prevMonthIndex]}-${prevYear.toString().slice(-2)}`
    
    const prevRentedAccounts = prevRentedAccountsRaw?.filter(item => {
      const labels = Array.isArray(item.labels) ? item.labels : (typeof item.labels === 'string' ? [item.labels] : [])
      if (labels.length === 0) return false
      
      return labels.some(label => {
        const labelStr = typeof label === 'string' ? label.toLowerCase() : String(label).toLowerCase()
        return labelStr.includes(prevMonthLabel) || 
               labelStr.includes(prevMonthLabelAlt1) || 
               labelStr.includes(prevMonthLabelAlt2) ||
               labelStr.includes(monthNames[prevMonthIndex])
      })
    }) || []
    
    const prevMonthRentedAccounts = prevRentedAccounts.length || 0
    const rentalTrendPercentage = prevMonthRentedAccounts > 0
      ? ((rentedAccounts?.length || 0) - prevMonthRentedAccounts) / prevMonthRentedAccounts * 100
      : 0
    
    const response = {
      success: true,
      data: {
        totalRentedAccounts: rentedAccounts?.length || 0,
        totalRentedAmount: totalRentedAmount,
        previousMonthRentedAccounts: prevMonthRentedAccounts,
        rentalTrendPercentage,
        totalSalesQuantity: salesQuantityData?.length || 0,
        totalSalesAmount,
        totalAccountCreated,
        previousMonthAccountCreated: prevMonthAccountCreated,
        growthRate,
        dailyAccountCreation,
        rentalTrend,
        salesTrend,
        usageVolumeTrend,
      },
      debug: {
        monthLabel,
        dateRange: {
          start: startOfMonthISO,
          end: endOfMonthISO,
        },
        rawCounts: {
          allRentedAccounts: allRentedAccounts?.length || 0,
          filteredRentedAccounts: rentedAccounts?.length || 0,
          allSalesQuantity: salesQuantityDataRaw?.length || 0,
          filteredSalesQuantity: salesQuantityData?.length || 0,
          allAccountCreated: accountCreatedData?.length || 0,
        },
        sampleLabels: allRentedAccounts?.slice(0, 3).map(item => item.labels) || [],
      },
    }
    
    console.log('API Response:', JSON.stringify(response, null, 2))
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching wealths data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
