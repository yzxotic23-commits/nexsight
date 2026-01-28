import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

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

    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1)
    const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
    
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
    
    // Helper function to filter by labels
    const filterByLabels = (items, requireMonthLabel = true) => {
      if (!items || items.length === 0) {
        console.log('No items to filter')
        return []
      }
      
      const filtered = items.filter(item => {
        const labels = Array.isArray(item.labels) ? item.labels : (typeof item.labels === 'string' ? [item.labels] : [])
        
        if (labels.length === 0) {
          return false
        }
        
        const hasWealths = labels.some(label => {
          const labelStr = typeof label === 'string' ? label.toLowerCase() : String(label).toLowerCase()
          return labelStr.includes('wealths+') || labelStr.includes('wealths')
        })
        
        if (!hasWealths) {
          return false
        }
        
        // If month label is required, check for it
        if (requireMonthLabel) {
          const hasMonthLabel = labels.some(label => {
            const labelStr = typeof label === 'string' ? label.toLowerCase() : String(label).toLowerCase()
            return labelStr.includes(monthLabel) || 
                   labelStr.includes(monthLabelAlt1) || 
                   labelStr.includes(monthLabelAlt2) ||
                   labelStr.includes(monthNames[monthIndex])
          })
          return hasMonthLabel
        }
        
        return true
      })
      
      console.log(`Filtered ${filtered.length} items from ${items.length} total items (requireMonthLabel: ${requireMonthLabel})`)
      if (filtered.length === 0 && requireMonthLabel) {
        console.log('No items found with month label, trying without month label requirement...')
        return filterByLabels(items, false)
      }
      
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
    
    const { data: allRentedAccounts, error: rentedError } = await supabaseServer
      .from('jira_issues')
      .select('id, labels, created_at')
      .eq('project_key', 'WEO')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    if (rentedError) {
      console.error('Error fetching rented accounts:', rentedError)
    }

    console.log(`Fetched ${allRentedAccounts?.length || 0} WEO accounts for the month`)
    console.log('Date range:', startOfMonth.toISOString(), 'to', endOfMonth.toISOString())
    
    if (allRentedAccounts && allRentedAccounts.length > 0) {
      console.log('Sample labels from first 3 items:', allRentedAccounts.slice(0, 3).map(item => ({
        labels: item.labels,
        labelsType: typeof item.labels,
        isArray: Array.isArray(item.labels),
        created_at: item.created_at
      })))
    }
    
    const rentedAccounts = filterByLabels(allRentedAccounts)
    console.log(`After filtering: ${rentedAccounts?.length || 0} rented accounts`)
    
    // If no data after filtering, try without month label requirement for debugging
    if (rentedAccounts.length === 0 && allRentedAccounts && allRentedAccounts.length > 0) {
      console.log('No data found with month label filter. Trying without month label requirement...')
      const rentedAccountsNoMonth = filterByLabels(allRentedAccounts, false)
      console.log(`Found ${rentedAccountsNoMonth.length} accounts without month label requirement`)
      
      // For debugging: return data without month label filter if no data with filter
      if (rentedAccountsNoMonth.length > 0) {
        console.log('WARNING: Using data without month label filter for debugging')
        // We'll use this data but log a warning
      }
    }

    // 2. Total Rented Amount: sum of total_rental_amount_weo
    const { data: rentedAmountDataRaw, error: rentedAmountError } = await supabaseServer
      .from('jira_issues')
      .select('total_rental_amount_weo, labels, created_at')
      .eq('project_key', 'WEO')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())
      .not('total_rental_amount_weo', 'is', null)

    if (rentedAmountError) {
      console.error('Error fetching rented amount:', rentedAmountError)
    }

    const rentedAmountData = filterByLabels(rentedAmountDataRaw)
    const totalRentedAmount = rentedAmountData?.reduce((sum, item) => {
      return sum + (parseFloat(item.total_rental_amount_weo) || 0)
    }, 0) || 0

    // 3. Total Sales Quantity: all WEO tasks created in the month
    const { data: salesQuantityData, error: salesQuantityError } = await supabaseServer
      .from('jira_issues')
      .select('id')
      .eq('project_key', 'WEO')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    if (salesQuantityError) {
      console.error('Error fetching sales quantity:', salesQuantityError)
    }

    // 4. Total Sales Amount: selling_price_weo - (total_rental_amount_weo + total_commission_amount_weo)
    const { data: salesAmountData, error: salesAmountError } = await supabaseServer
      .from('jira_issues')
      .select('created_at, selling_price_weo, total_rental_amount_weo, total_commission_amount_weo')
      .eq('project_key', 'WEO')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())
      .not('selling_price_weo', 'is', null)

    if (salesAmountError) {
      console.error('Error fetching sales amount:', salesAmountError)
    }

    const totalSalesAmount = salesAmountData?.reduce((sum, item) => {
      const sellingPrice = parseFloat(item.selling_price_weo) || 0
      const rentalAmount = parseFloat(item.total_rental_amount_weo) || 0
      const commissionAmount = parseFloat(item.total_commission_amount_weo) || 0
      return sum + (sellingPrice - rentalAmount - commissionAmount)
    }, 0) || 0

    // 5. Total Account Created: all tasks (WNLE & WEO) created in the month
    const { data: accountCreatedData, error: accountCreatedError } = await supabaseServer
      .from('jira_issues')
      .select('id, created_at')
      .in('project_key', ['WNLE', 'WEO'])
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    if (accountCreatedError) {
      console.error('Error fetching account created:', accountCreatedError)
    }

    // Previous month account created for growth rate
    const { data: prevAccountCreatedData, error: prevAccountError } = await supabaseServer
      .from('jira_issues')
      .select('id')
      .in('project_key', ['WNLE', 'WEO'])
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString())

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

    // 7. Rental Trend: daily rental amount over the month
    const { data: allRentalTrendData, error: rentalTrendError } = await supabaseServer
      .from('jira_issues')
      .select('created_at, total_rental_amount_weo, labels')
      .eq('project_key', 'WEO')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())
      .not('total_rental_amount_weo', 'is', null)

    if (rentalTrendError) {
      console.error('Error fetching rental trend:', rentalTrendError)
    }

    const rentalTrendData = filterByLabels(allRentalTrendData)
    const rentalTrend = {}
    rentalTrendData?.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      rentalTrend[date] = (rentalTrend[date] || 0) + (parseFloat(item.total_rental_amount_weo) || 0)
    })

    // 8. Sales Trend: daily sales amount over the month
    const salesTrend = {}
    salesAmountData?.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      const sellingPrice = parseFloat(item.selling_price_weo) || 0
      const rentalAmount = parseFloat(item.total_rental_amount_weo) || 0
      const commissionAmount = parseFloat(item.total_commission_amount_weo) || 0
      const salesAmount = sellingPrice - rentalAmount - commissionAmount
      salesTrend[date] = (salesTrend[date] || 0) + salesAmount
    })

    // 9. Usage Volume Trend: daily count of accounts used
    const { data: usageVolumeData, error: usageVolumeError } = await supabaseServer
      .from('jira_issues')
      .select('created_at')
      .eq('project_key', 'WEO')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    if (usageVolumeError) {
      console.error('Error fetching usage volume:', usageVolumeError)
    }

    const usageVolumeTrend = {}
    usageVolumeData?.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      usageVolumeTrend[date] = (usageVolumeTrend[date] || 0) + 1
    })

    // Previous month rented accounts for rental trend
    const { data: prevRentedAccounts, error: prevRentedError } = await supabaseServer
      .from('jira_issues')
      .select('id, labels')
      .eq('project_key', 'WEO')
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString())

    if (prevRentedError) {
      console.error('Error fetching previous month rented accounts:', prevRentedError)
    }

    const prevMonthRentedAccounts = filterByLabels(prevRentedAccounts)?.length || 0
    const rentalTrendPercentage = prevMonthRentedAccounts > 0
      ? ((rentedAccounts?.length || 0) - prevMonthRentedAccounts) / prevMonthRentedAccounts * 100
      : 0

    // For debugging: if no filtered data, try to return all WEO data without label filter
    // TEMPORARY: Show all WEO data if no filtered data found (for testing)
    let finalRentedAccounts = rentedAccounts
    let finalRentedAmount = totalRentedAmount
    let useAllData = false
    
    if (rentedAccounts.length === 0 && allRentedAccounts && allRentedAccounts.length > 0) {
      console.log('DEBUG: No data with label filter, using all WEO data for this month (TEMPORARY FOR TESTING)')
      finalRentedAccounts = allRentedAccounts
      useAllData = true
      
      // Recalculate total rented amount from all data
      const { data: allRentedAmountData, error: allRentedAmountError } = await supabaseServer
        .from('jira_issues')
        .select('total_rental_amount_weo, created_at')
        .eq('project_key', 'WEO')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .not('total_rental_amount_weo', 'is', null)
      
      if (!allRentedAmountError && allRentedAmountData) {
        finalRentedAmount = allRentedAmountData.reduce((sum, item) => {
          return sum + (parseFloat(item.total_rental_amount_weo) || 0)
        }, 0)
      }
    }
    
    // Also update rental trend to use all data if needed
    let finalRentalTrend = rentalTrend
    if (useAllData && allRentalTrendData && allRentalTrendData.length > 0) {
      finalRentalTrend = {}
      allRentalTrendData.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0]
        finalRentalTrend[date] = (finalRentalTrend[date] || 0) + (parseFloat(item.total_rental_amount_weo) || 0)
      })
    }
    
    const response = {
      success: true,
      data: {
        totalRentedAccounts: finalRentedAccounts?.length || 0,
        totalRentedAmount: finalRentedAmount,
        previousMonthRentedAccounts: prevMonthRentedAccounts,
        rentalTrendPercentage,
        totalSalesQuantity: salesQuantityData?.length || 0,
        totalSalesAmount,
        totalAccountCreated,
        previousMonthAccountCreated: prevMonthAccountCreated,
        growthRate,
        dailyAccountCreation,
        rentalTrend: finalRentalTrend,
        salesTrend,
        usageVolumeTrend,
      },
      debug: {
        monthLabel,
        dateRange: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString(),
        },
        rawCounts: {
          allRentedAccounts: allRentedAccounts?.length || 0,
          filteredRentedAccounts: rentedAccounts?.length || 0,
          finalRentedAccounts: finalRentedAccounts?.length || 0,
          allSalesQuantity: salesQuantityData?.length || 0,
          allAccountCreated: accountCreatedData?.length || 0,
        },
        sampleLabels: allRentedAccounts?.slice(0, 3).map(item => item.labels) || [],
        usingAllData: useAllData, // Flag to indicate if we're using all data without label filter
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
