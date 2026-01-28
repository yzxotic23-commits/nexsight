import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    
    console.log('Fetching bank owner data for month:', month)

    // Query bank_owner table - only SGD
    let query = supabaseServer
      .from('bank_owner')
      .select('*')
      .eq('currency', 'SGD') // Only fetch SGD data
      .order('created_at', { ascending: false })

    // Filter by month if provided
    if (month) {
      query = query.eq('month', month)
    }

    const { data: bankOwnerData, error } = await query

    if (error) {
      console.error('Error fetching bank owner data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bank owner data', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Fetched ${bankOwnerData?.length || 0} bank owner records`)

    return NextResponse.json({
      success: true,
      data: bankOwnerData || [],
      count: bankOwnerData?.length || 0,
    })
  } catch (error) {
    console.error('Error in bank owner API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Ensure currency is always SGD
    body.currency = 'SGD'
    
    console.log('Creating/updating bank owner record:', body)

    // Use upsert to handle both insert and update based on unique constraint (particular, month, currency)
    const { data, error } = await supabaseServer
      .from('bank_owner')
      .upsert([body], {
        onConflict: 'particular,month,currency',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('Error upserting bank owner record:', error)
      return NextResponse.json(
        { error: 'Failed to create/update record', details: error.message },
        { status: 500 }
      )
    }

    console.log('Bank owner record upserted:', data)

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error) {
    console.error('Error in bank owner POST:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }

    console.log('Updating bank owner record:', id, updateData)

    const { data, error } = await supabaseServer
      .from('bank_owner')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating bank owner record:', error)
      return NextResponse.json(
        { error: 'Failed to update record', details: error.message },
        { status: 500 }
      )
    }

    console.log('Bank owner record updated:', data)

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error) {
    console.error('Error in bank owner PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting bank owner record:', id)

    const { error } = await supabaseServer
      .from('bank_owner')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting bank owner record:', error)
      return NextResponse.json(
        { error: 'Failed to delete record', details: error.message },
        { status: 500 }
      )
    }

    console.log('Bank owner record deleted:', id)

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
    })
  } catch (error) {
    console.error('Error in bank owner DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
