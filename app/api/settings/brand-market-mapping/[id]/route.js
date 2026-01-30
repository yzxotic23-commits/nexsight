import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// GET - Fetch single brand market mapping by ID
export async function GET(request, { params }) {
  try {
    const { id } = params

    const { data, error } = await supabaseServer
      .from('sight_general_brand_market_mapping')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching brand market mapping:', error)
      return NextResponse.json(
        { error: 'Failed to fetch brand market mapping', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Brand market mapping not found' },
        { status: 404 }
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

// PUT - Update brand market mapping
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { brand, market, status, updated_by } = body

    // Validation
    if (market && !['SGD', 'MYR', 'USC'].includes(market)) {
      return NextResponse.json(
        { error: 'Invalid market. Must be SGD, MYR, or USC' },
        { status: 400 }
      )
    }

    if (status && !['Active', 'Inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be Active or Inactive' },
        { status: 400 }
      )
    }

    const updateData = {}
    if (brand) updateData.brand = brand.trim()
    if (market) updateData.market = market
    if (status) updateData.status = status
    if (updated_by) updateData.updated_by = updated_by

    const { data, error } = await supabaseServer
      .from('sight_general_brand_market_mapping')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating brand market mapping:', error)
      return NextResponse.json(
        { error: 'Failed to update brand market mapping', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Brand market mapping not found' },
        { status: 404 }
      )
    }

    // Log activity (non-blocking)
    try {
      await supabaseServer
        .from('sight_activity_log')
        .insert({
          user_name: updated_by || 'system',
          user_id: null,
          action: 'Updated Brand Market Mapping',
          target: 'Settings',
          details: { id, brand: data.brand, market: data.market, status: data.status }
        })
    } catch (logError) {
      console.error('Failed to log activity (non-critical):', logError.message)
    }

    return NextResponse.json({ data, success: true, message: 'Brand market mapping updated successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete brand market mapping
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Get mapping details before deletion for logging
    const { data: mappingToDelete } = await supabaseServer
      .from('sight_general_brand_market_mapping')
      .select('brand, market')
      .eq('id', id)
      .single()

    const { error } = await supabaseServer
      .from('sight_general_brand_market_mapping')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting brand market mapping:', error)
      return NextResponse.json(
        { error: 'Failed to delete brand market mapping', details: error.message },
        { status: 500 }
      )
    }

    // Log activity (non-blocking)
    if (mappingToDelete) {
      try {
        await supabaseServer
          .from('sight_activity_log')
          .insert({
            user_name: 'system',
            user_id: null,
            action: 'Deleted Brand Market Mapping',
            target: 'Settings',
            details: { brand: mappingToDelete.brand, market: mappingToDelete.market }
          })
      } catch (logError) {
        console.error('Failed to log activity (non-critical):', logError.message)
      }
    }

    return NextResponse.json({ success: true, message: 'Brand market mapping deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
