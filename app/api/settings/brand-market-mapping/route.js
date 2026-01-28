import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// GET - Fetch all brand market mappings
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('sight_general_brand_market_mapping')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching brand market mapping:', error)
      return NextResponse.json(
        { error: 'Failed to fetch brand market mapping', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new brand market mapping
export async function POST(request) {
  try {
    const body = await request.json()
    const { brand, market, status, created_by } = body

    // Validation
    if (!brand || !market) {
      return NextResponse.json(
        { error: 'Brand and market are required' },
        { status: 400 }
      )
    }

    if (!['SGD', 'MYR', 'USC'].includes(market)) {
      return NextResponse.json(
        { error: 'Invalid market. Must be SGD, MYR, or USC' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('sight_general_brand_market_mapping')
      .insert({
        brand: brand.trim(),
        market,
        status: status || 'Active',
        created_by: created_by || 'system',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating brand market mapping:', error)
      return NextResponse.json(
        { error: 'Failed to create brand market mapping', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, success: true, message: 'Brand market mapping created successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
