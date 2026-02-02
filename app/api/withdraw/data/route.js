import { NextResponse } from 'next/server'
import { supabaseDataServer } from '@/lib/supabase/data-server'

export const dynamic = 'force-dynamic'

// Helper to convert HH:MM:SS to seconds
const timeToSeconds = (timeString) => {
  if (!timeString) return 0
  const timeStr = String(timeString).trim()
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    const hours = parseInt(parts[0]) || 0
    const minutes = parseInt(parts[1]) || 0
    const seconds = parseFloat(parts[2]) || 0
    return (hours * 3600) + (minutes * 60) + seconds
  }
  const num = parseFloat(timeStr)
  return isNaN(num) ? 0 : num
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const currency = searchParams.get('currency') // MYR, SGD, USC
    const brand = searchParams.get('brand') // optional

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    // Table mapping
    let tableName
    if (currency === 'MYR') tableName = 'withdraw'
    else if (currency === 'SGD') tableName = 'withdraw_sgd'
    else if (currency === 'USC') tableName = 'withdraw_usc'
    else {
      return NextResponse.json({ success: true, data: {
        totalTransaction: 0,
        avgProcessingTime: 0,
        dailyData: [],
        chartData: { overdueTrans: {}, avgProcessingTime: {}, transactionVolume: {} },
        slowTransactions: [],
        slowTransactionSummary: { totalSlowTransaction: 0, avgProcessingTime: 0, brand: 'N/A' },
        brandComparison: [],
      }})
    }

    // Debug: Log date range received with detailed info
    console.log(`=== Withdraw API - Received request ===`)
    console.log(`Currency: ${currency}, Table: ${tableName}`)
    console.log(`📅 Start Date: "${startDate}" (type: ${typeof startDate}, length: ${startDate?.length})`)
    console.log(`📅 End Date: "${endDate}" (type: ${typeof endDate}, length: ${endDate?.length})`)
    console.log(`Trimmed Start: "${startDate?.trim()}"`)
    console.log(`Trimmed End: "${endDate?.trim()}"`)
    console.log(`=======================================`)
    
    // Build query
    let query = supabaseDataServer
      .from(tableName)
      .select('*')
    
    // Handle single date vs date range
    // Note: If date column is TEXT, we need to ensure proper string comparison
    // Using gte/lte should work for TEXT columns in YYYY-MM-DD format
    if (startDate === endDate) {
      // For single date, use eq() for exact match
      // Trim any whitespace that might exist in the database
      query = query.eq('date', startDate.trim())
      console.log(`Withdraw API - Single date query: date = '${startDate.trim()}'`)
    } else {
      // For date range, use gte and lte
      // Ensure dates are trimmed and in correct format
      const trimmedStart = startDate.trim()
      const trimmedEnd = endDate.trim()
      query = query.gte('date', trimmedStart).lte('date', trimmedEnd)
      console.log(`Withdraw API - Date range query: date >= '${trimmedStart}' AND date <= '${trimmedEnd}'`)
    }

    if (brand && brand !== 'ALL') {
      const brandTrim = String(brand).trim()
      query = query.ilike('line', `%${brandTrim}%`)
    }

    const { data: rows, error } = await query
    if (error) {
      console.error('Error fetching withdraw data:', error)
      return NextResponse.json({ error: 'Failed to fetch withdraw data', details: error.message }, { status: 500 })
    }

    // Debug: Log fetched data count and sample dates
    console.log(`Withdraw API - Fetched ${rows?.length || 0} records from ${tableName} for date range ${startDate} to ${endDate}`)
    if (rows && rows.length > 0) {
      const sampleDates = rows.slice(0, 5).map(r => r.date).filter(Boolean)
      const uniqueDates = [...new Set(rows.map(r => r.date).filter(Boolean))]
      const minDate = rows.length > 0 ? Math.min(...rows.map(r => r.date ? new Date(r.date).getTime() : Infinity)) : null
      const maxDate = rows.length > 0 ? Math.max(...rows.map(r => r.date ? new Date(r.date).getTime() : -Infinity)) : null
      console.log(`Withdraw API - Sample dates from ${tableName}:`, sampleDates)
      console.log(`Withdraw API - Unique dates in result:`, uniqueDates)
      console.log(`Withdraw API - Date range in data: min=${minDate ? new Date(minDate).toISOString().split('T')[0] : 'N/A'}, max=${maxDate ? new Date(maxDate).toISOString().split('T')[0] : 'N/A'}`)
      console.log(`Withdraw API - Requested date range: ${startDate} to ${endDate}`)
    } else {
      console.log(`Withdraw API - No data found for ${tableName} with date range ${startDate} to ${endDate}`)
      // Try to check if there's any data in the table at all
      const { data: allData, error: checkError } = await supabaseDataServer
        .from(tableName)
        .select('date')
        .limit(10)
        .order('date', { ascending: false })
      if (!checkError && allData && allData.length > 0) {
        const latestDates = allData.map(d => d.date).filter(Boolean)
        console.log(`Withdraw API - Latest dates in ${tableName} table:`, latestDates)
      }
    }

    // Total Transaction = number of rows
    const totalTransaction = rows?.length || 0

    // Avg Processing Time = average of process_time (in seconds) for rows with valid process_time
    let totalProcessing = 0
    let countProcessing = 0
    rows?.forEach(r => {
      const secs = timeToSeconds(r.process_time)
      if (secs > 0) {
        totalProcessing += secs
        countProcessing++
      }
    })
    const avgProcessingTime = countProcessing > 0 ? totalProcessing / countProcessing : 0

    // Daily aggregation
    const dailyCounts = {}
    const dailyOverdue = {}
    const dailyAvgTime = {}
    const dailyVolume = {}

    rows?.forEach(r => {
      const date = r.date
      if (!date) return
      dailyCounts[date] = (dailyCounts[date] || 0) + 1
      // transactionVolume should be count, not amount
      dailyVolume[date] = (dailyVolume[date] || 0) + 1
      const secs = timeToSeconds(r.process_time)
      if (!dailyAvgTime[date]) { dailyAvgTime[date] = { sum: 0, count: 0 } }
      if (secs > 0) {
        dailyAvgTime[date].sum += secs
        dailyAvgTime[date].count += 1
      }
      if (secs > 300) {
        dailyOverdue[date] = (dailyOverdue[date] || 0) + 1
      }
    })

    const dailyData = Object.keys(dailyCounts).sort((a,b)=>new Date(a)-new Date(b)).map(date => ({
      date,
      count: dailyCounts[date] || 0
    }))

    // chartData structure
    const chartData = {
      overdueTrans: dailyOverdue,
      avgProcessingTime: Object.fromEntries(Object.entries(dailyAvgTime).map(([d, v]) => [d, v.count>0 ? v.sum/v.count : 0])),
      transactionVolume: dailyVolume
    }

    // Slow transactions (> 5 minutes) - limit to 200 for performance
    const slowTransactions = (rows?.filter(r => timeToSeconds(r.process_time) > 300) || [])
      .slice(0, 200) // Limit early for better performance
      .map(r => ({
        brand: r.line || 'UNKNOWN',
        customerName: r.user_name || r.user || 'N/A',
        amount: r.amount ? parseFloat(r.amount) : 0,
        processingTime: Math.round(timeToSeconds(r.process_time) * 10) / 10,
        completed: r.completed || '',
        date: r.date,
        operatorGroup: r.operator_group || ''
      }))

    const slowTransactionSummary = {
      totalSlowTransaction: slowTransactions.length,
      avgProcessingTime: slowTransactions.length > 0 ? Math.round((slowTransactions.reduce((s, t)=> s + t.processingTime, 0) / slowTransactions.length) * 10) / 10 : 0,
      brand: slowTransactions.length > 0 ? slowTransactions[0].brand : 'N/A'
    }

    // Brand comparison - aggregate per line
    const brandMap = {}
    rows?.forEach(r => {
      const b = r.line || 'UNKNOWN'
      if (!brandMap[b]) brandMap[b] = { total:0, overdue:0, processingSum:0, processingCount:0 }
      brandMap[b].total++
      const secs = timeToSeconds(r.process_time)
      if (secs>0) {
        brandMap[b].processingSum += secs
        brandMap[b].processingCount++
      }
      if (secs>300) brandMap[b].overdue++
    })
    const brandComparison = Object.keys(brandMap).map(b => {
      const d = brandMap[b]
      return {
        brand: b,
        avgTime: d.processingCount>0 ? Math.round((d.processingSum/d.processingCount)*10)/10 : 0,
        totalTransaction: d.total,
        totalOverdue: d.overdue
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalTransaction,
        avgProcessingTime,
        dailyData,
        chartData,
        slowTransactions,
        slowTransactionSummary,
        brandComparison
      }
    })
  } catch (error) {
    console.error('Error in withdraw data API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

