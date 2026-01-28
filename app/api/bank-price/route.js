import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('currency') // SGD, MYR, or USC
    const startDate = searchParams.get('startDate') // Filter by created_at date range
    const endDate = searchParams.get('endDate') // Filter by created_at date range
    
    console.log('Fetching bank price data:', { currency, startDate, endDate })

    // Query bank_price table
    let query = supabaseServer
      .from('bank_price')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by currency if provided
    if (currency) {
      query = query.eq('currency', currency)
    }
    
    // Filter by date range if provided
    // Now that start_date is DATE type, we can filter directly by start_date
    if (startDate && endDate) {
      // Filter by start_date (DATE type) - accounts where start_date is within the date range
      query = query.gte('start_date', startDate)
      query = query.lte('start_date', endDate)
    }

    const { data: bankPriceData, error } = await query

    if (error) {
      console.error('Error fetching bank price data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bank price data', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Fetched ${bankPriceData?.length || 0} bank price records`)

    return NextResponse.json({
      success: true,
      data: bankPriceData || [],
      count: bankPriceData?.length || 0,
    })
  } catch (error) {
    console.error('Error in bank price API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    console.log('Creating new bank price record:', body)

    const { data, error } = await supabaseServer
      .from('bank_price')
      .insert([body])
      .select()

    if (error) {
      console.error('Error creating bank price record:', error)
      return NextResponse.json(
        { error: 'Failed to create record', details: error.message },
        { status: 500 }
      )
    }

    console.log('Bank price record created:', data)

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error) {
    console.error('Error in bank price POST:', error)
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

    console.log('Updating bank price record:', id, updateData)

    const { data, error } = await supabaseServer
      .from('bank_price')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating bank price record:', error)
      return NextResponse.json(
        { error: 'Failed to update record', details: error.message },
        { status: 500 }
      )
    }

    console.log('Bank price record updated:', data)

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error) {
    console.error('Error in bank price PUT:', error)
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

    console.log('Deleting bank price record:', id)

    const { error } = await supabaseServer
      .from('bank_price')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting bank price record:', error)
      return NextResponse.json(
        { error: 'Failed to delete record', details: error.message },
        { status: 500 }
      )
    }

    console.log('Bank price record deleted:', id)

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
    })
  } catch (error) {
    console.error('Error in bank price DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
