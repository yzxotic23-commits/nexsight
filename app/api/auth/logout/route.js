import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('nexsight-session')
    
    let userName = 'Unknown'
    let userId = null
    
    // Get user info from session before deleting
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie.value)
        userName = session.name || session.username || 'Unknown'
        userId = session.id || null
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    cookieStore.delete('nexsight-session')

    // Get IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Log activity (non-blocking)
    try {
      await supabaseServer
        .from('sight_activity_log')
        .insert({
          user_name: userName,
          user_id: userId,
          action: 'Logout',
          target: 'System',
          ip_address: ipAddress,
          user_agent: userAgent,
        })
    } catch (logError) {
      console.error('Failed to log activity (non-critical):', logError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
