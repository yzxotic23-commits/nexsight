import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch all activity logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 100
    const offset = parseInt(searchParams.get('offset')) || 0

    const { data, error } = await supabaseServer
      .from('sight_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching activity logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activity logs', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error in activity log GET:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new activity log entry
export async function POST(request) {
  try {
    const body = await request.json()
    const { user_name, user_id, action, target, ip_address, user_agent, details } = body

    // Validation
    if (!user_name || !action) {
      return NextResponse.json(
        { error: 'User name and action are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('sight_activity_log')
      .insert({
        user_name: user_name.trim(),
        user_id: user_id || null,
        action: action.trim(),
        target: target || null,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        details: details || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating activity log:', error)
      return NextResponse.json(
        { error: 'Failed to create activity log', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in activity log POST:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
