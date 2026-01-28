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

    // Format month label for label matching (e.g., "jan-2026", "jan2026", "january-2026")
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const monthIndex = start.getMonth()
    const year = start.getFullYear()
    const monthLabel = `${monthNames[monthIndex]}-${year}` // e.g., "jan-2026"
    const monthLabelAlt1 = `${monthNames[monthIndex]}${year}` // e.g., "jan2026"
    const monthLabelAlt2 = `${monthNames[monthIndex]}-${year.toString().slice(-2)}` // e.g., "jan-26"

    // Fetch WNLE data with created_at date range
    const { data: wnleDataRaw, error: wnleError } = await supabaseServer
      .from('jira_issues')
      .select('id, labels, created_at')
      .eq('project_key', 'WNLE')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    if (wnleError) {
      console.error('Error fetching WNLE data:', wnleError)
      return NextResponse.json(
        { error: 'Failed to fetch WNLE data', details: wnleError.message },
        { status: 500 }
      )
    }

    // Filter by month label
    const filterByMonthLabel = (items) => {
      if (!items || items.length === 0) {
        return []
      }
      
      return items.filter(item => {
        const labels = Array.isArray(item.labels) ? item.labels : (typeof item.labels === 'string' ? [item.labels] : [])
        
        if (labels.length === 0) {
          return false
        }
        
        // Check for month label
        const hasMonthLabel = labels.some(label => {
          const labelStr = typeof label === 'string' ? label.toLowerCase() : String(label).toLowerCase()
          return labelStr.includes(monthLabel) || 
                 labelStr.includes(monthLabelAlt1) || 
                 labelStr.includes(monthLabelAlt2) ||
                 labelStr.includes(monthNames[monthIndex])
        })
        
        return hasMonthLabel
      })
    }

    const wnleData = filterByMonthLabel(wnleDataRaw)
    const count = wnleData?.length || 0

    return NextResponse.json({
      success: true,
      count,
      debug: {
        monthLabel,
        totalWNLE: wnleDataRaw?.length || 0,
        filteredWNLE: count,
        dateRange: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString(),
        }
      }
    })
  } catch (error) {
    console.error('Error in WNLE count API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
