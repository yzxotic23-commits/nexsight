import { NextResponse } from 'next/server'
import { supabaseDataServer } from '@/lib/supabase/data-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const currency = searchParams.get('currency') // MYR, SGD, USC
    const brand = searchParams.get('brand') // Brand filter (optional)

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    // Determine table name based on currency
    let tableName
    if (currency === 'MYR') {
      tableName = 'deposit'
    } else if (currency === 'SGD') {
      tableName = 'deposit_sgd'
    } else if (currency === 'USC') {
      tableName = 'deposit_usc'
    } else {
      // Return 0 for other currencies not yet implemented
      return NextResponse.json({
        success: true,
        data: {
          totalTransaction: 0,
          totalTransAutomation: 0,
          avgProcessingTime: 0,
          overdueOver60s: 0,
          coverageRate: 0,
          dailyData: [],
          chartData: {
            overdueTrans: {},
            avgProcessingTime: {},
            coverageRate: {},
            transactionVolume: {}
          },
          brandComparison: [],
          slowTransactions: [],
          slowTransactionSummary: {
            totalSlowTransaction: 0,
            avgProcessingTime: 0,
            brand: 'N/A'
          },
          caseVolume: []
        },
        message: `${currency} data not yet implemented`
      })
    }

    // Build query - temporarily using select('*') to avoid column mismatch errors
    // TODO: Optimize to select only needed columns once schema is confirmed
    let query = supabaseDataServer
      .from(tableName)
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)

    // Filter by brand using 'line' column if provided and not 'ALL'
    if (brand && brand !== 'ALL') {
      const brandTrim = String(brand).trim()
      query = query.ilike('line', `%${brandTrim}%`)
    }

    const { data: depositData, error } = await query

    if (error) {
      console.error(`Error fetching deposit data from ${tableName}:`, error)
      return NextResponse.json(
        { error: 'Failed to fetch deposit data', details: error.message },
        { status: 500 }
      )
    }
    
    // If no data found, return empty structure
    if (!depositData || depositData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalTransaction: 0,
          totalTransAutomation: 0,
          avgProcessingTime: 0,
          overdueOver60s: 0,
          coverageRate: 0,
          dailyData: [],
          chartData: {
            overdueTrans: {},
            avgProcessingTime: {},
            coverageRate: {},
            transactionVolume: {}
          },
          brandComparison: [],
          slowTransactions: [],
          slowTransactionSummary: {
            totalSlowTransaction: 0,
            avgProcessingTime: 0,
            brand: 'N/A'
          },
          caseVolume: []
        }
      })
    }

    // Helper function to convert HH:MM:SS to seconds
    const timeToSeconds = (timeString) => {
      if (!timeString) return 0
      
      // Handle different time formats
      const timeStr = String(timeString).trim()
      
      // Format: HH:MM:SS or HH:MM:SS.mmm
      const parts = timeStr.split(':')
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]) || 0
        const minutes = parseInt(parts[1]) || 0
        const seconds = parseFloat(parts[2]) || 0
        
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds
        return totalSeconds
      }
      
      // Fallback: try to parse as number
      const num = parseFloat(timeStr)
      return isNaN(num) ? 0 : num
    }


    // Calculate metrics
    const totalTransaction = depositData?.length || 0

    // Total Trans Automation: operator_group contains 'Automation'
    const automationTransactions = depositData?.filter(item => {
      const operatorGroup = item.operator_group || ''
      const isAutomation = operatorGroup.toLowerCase().includes('automation')
      return isAutomation
    }) || []
    const totalTransAutomation = automationTransactions.length

    // Avg Processing Time: average process_time for automation transactions
    let totalProcessingTime = 0
    let validProcessingTimeCount = 0
    
    automationTransactions.forEach(item => {
      const processTimeSeconds = timeToSeconds(item.process_time)
      if (processTimeSeconds > 0) {
        totalProcessingTime += processTimeSeconds
        validProcessingTimeCount++
      }
    })
    
    const avgProcessingTime = validProcessingTimeCount > 0
      ? totalProcessingTime / validProcessingTimeCount
      : 0

    // Overdue > 60s: count automation transactions with process_time > 60
    const overdueOver60s = automationTransactions.filter(item => {
      const processTimeSeconds = timeToSeconds(item.process_time)
      return processTimeSeconds > 60
    }).length

    // Coverage Rate: total transaction - transactions with 'staff' in operator_group
    const staffTransactions = depositData?.filter(item => {
      const operatorGroup = item.operator_group || ''
      return operatorGroup.toLowerCase().includes('staff')
    }) || []
    const coverageRate = totalTransaction > 0 
      ? ((totalTransaction - staffTransactions.length) / totalTransaction) * 100 
      : 0

    // Daily aggregation for charts
    const dailyData = {}
    const dailyOverdueCount = {}
    const dailyProcessingTime = {}
    const dailyCoverageRate = {}
    const dailyTransactionVolume = {}

    depositData?.forEach(item => {
      const date = item.date // Assuming date is in YYYY-MM-DD format
      if (!date) return

      // Initialize daily counters
      if (!dailyData[date]) {
        dailyData[date] = {
          total: 0,
          automation: 0,
          staff: 0,
          processingTimeSum: 0,
          processingTimeCount: 0,
          overdue: 0
        }
      }

      dailyData[date].total++
      dailyTransactionVolume[date] = (dailyTransactionVolume[date] || 0) + 1

      const operatorGroup = item.operator_group || ''
      const processTimeSeconds = timeToSeconds(item.process_time)

      if (operatorGroup.toLowerCase().includes('automation')) {
        dailyData[date].automation++
        dailyData[date].processingTimeSum += processTimeSeconds
        dailyData[date].processingTimeCount++
        
        if (processTimeSeconds > 60) {
          dailyData[date].overdue++
        }
      }

      if (operatorGroup.toLowerCase().includes('staff')) {
        dailyData[date].staff++
      }
    })

    // Calculate daily metrics
    Object.keys(dailyData).forEach(date => {
      const day = dailyData[date]
      
      dailyOverdueCount[date] = day.overdue
      dailyProcessingTime[date] = day.processingTimeCount > 0 
        ? day.processingTimeSum / day.processingTimeCount 
        : 0
      dailyCoverageRate[date] = day.total > 0 
        ? ((day.total - day.staff) / day.total) * 100 
        : 0
    })

    // Brand comparison aggregation
    const brandData = {}
    
    depositData?.forEach(item => {
      const brand = item.line || 'UNKNOWN'
      if (!brandData[brand]) {
        brandData[brand] = {
          total: 0,
          automation: 0,
          staff: 0,
          processingTimeSum: 0,
          processingTimeCount: 0,
          overdue: 0
        }
      }
      
      brandData[brand].total++
      
      const operatorGroup = item.operator_group || ''
      const processTimeSeconds = timeToSeconds(item.process_time)
      
      if (operatorGroup.toLowerCase().includes('automation')) {
        brandData[brand].automation++
        brandData[brand].processingTimeSum += processTimeSeconds
        brandData[brand].processingTimeCount++
        
        if (processTimeSeconds > 60) {
          brandData[brand].overdue++
        }
      }
      
      if (operatorGroup.toLowerCase().includes('staff')) {
        brandData[brand].staff++
      }
    })
    
    // Calculate brand metrics
    const brandComparison = Object.keys(brandData).map(brand => {
      const data = brandData[brand]
      const avgTime = data.processingTimeCount > 0 
        ? data.processingTimeSum / data.processingTimeCount 
        : 0
      const coverageRate = data.total > 0 
        ? ((data.total - data.staff) / data.total) * 100 
        : 0
      
      return {
        brand,
        avgTime: Math.round(avgTime * 10) / 10, // Round to 1 decimal
        coverageRate: Math.round(coverageRate * 10) / 10,
        totalTransaction: data.total,
        totalAutomation: data.automation,
        totalOverdue: data.overdue
      }
    }).sort((a, b) => a.avgTime - b.avgTime) // Sort by avgTime ascending

    // Get slow transactions (> 60 seconds) - only automation transactions
    // Limit to 200 records for performance (already limited in response)
    const slowTransactions = automationTransactions
      .filter(item => {
        const processTimeSeconds = timeToSeconds(item.process_time)
        return processTimeSeconds > 60
      })
      .slice(0, 200) // Limit early for better performance
      .map(item => {
        const processTimeSeconds = timeToSeconds(item.process_time)
        const dateObj = new Date(item.date)
        
        // Format date as YYYY-MM-DD or readable format
        const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        
        return {
          brand: item.line || 'UNKNOWN',
          customerName: item.user_name || item.customer_name || item.customer || 'N/A',
          amount: item.amount ? parseFloat(item.amount) : 0,
          processingTime: Math.round(processTimeSeconds * 10) / 10,
          completed: formattedDate,
          date: item.date,
          operatorGroup: item.operator_group || ''
        }
      })
      .sort((a, b) => b.processingTime - a.processingTime) // Sort by processing time descending

    // Calculate slow transaction summary
    const slowTransactionSummary = {
      totalSlowTransaction: slowTransactions.length,
      avgProcessingTime: slowTransactions.length > 0
        ? slowTransactions.reduce((sum, item) => sum + item.processingTime, 0) / slowTransactions.length
        : 0,
      brand: slowTransactions.length > 0
        ? slowTransactions.reduce((acc, item) => {
            acc[item.brand] = (acc[item.brand] || 0) + 1
            return acc
          }, {})
        : {}
    }
    
    // Get brand with most slow transactions
    const topBrand = Object.keys(slowTransactionSummary.brand).length > 0
      ? Object.entries(slowTransactionSummary.brand)
          .sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A'

    // Calculate case volume data per brand
    // totalCase = percentage of slow transactions (overdue > 60s) per brand
    // totalTransAutomation = total automation transactions per brand
    // totalOverdue = total overdue transactions (> 60s) per brand
    const caseVolume = brandComparison.map(brand => {
      // Calculate totalCase as percentage: (totalOverdue / totalAutomation) * 100
      // Or we can use a different metric - let's use totalOverdue as the case volume indicator
      const totalCase = brand.totalAutomation > 0
        ? (brand.totalOverdue / brand.totalAutomation) * 100
        : 0
      
      return {
        brand: brand.brand,
        totalCase: Math.round(totalCase * 100) / 100, // Round to 2 decimals
        totalTransAutomation: brand.totalAutomation,
        totalOverdue: brand.totalOverdue
      }
    }).sort((a, b) => b.totalCase - a.totalCase) // Sort by totalCase descending

    return NextResponse.json({
      success: true,
      data: {
        totalTransaction,
        totalTransAutomation,
        avgProcessingTime,
        overdueOver60s,
        coverageRate,
        dailyData: Object.keys(dailyData)
          .sort((a, b) => new Date(a) - new Date(b)) // Sort by date ascending
          .map(date => ({
            date,
            count: dailyData[date].total
          })),
        chartData: {
          overdueTrans: dailyOverdueCount,
          avgProcessingTime: dailyProcessingTime,
          coverageRate: dailyCoverageRate,
          transactionVolume: dailyTransactionVolume
        },
        brandComparison, // Add brand comparison data
        slowTransactions: slowTransactions.slice(0, 100), // Limit to 100 records
        slowTransactionSummary: {
          totalSlowTransaction: slowTransactionSummary.totalSlowTransaction,
          avgProcessingTime: Math.round(slowTransactionSummary.avgProcessingTime * 10) / 10,
          brand: topBrand
        },
        caseVolume // Add case volume data
      }
    })
  } catch (error) {
    console.error('Error in deposit data API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
