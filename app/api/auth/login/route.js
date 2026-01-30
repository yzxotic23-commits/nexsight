import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Cari user berdasarkan username
    const { data: user, error } = await supabaseServer
      .from('sight_user_management')
      .select('id, name, email, username, password_hash, role, status')
      .eq('username', username.trim().toLowerCase())
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check status
    if (user.status !== 'Active') {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      )
    }

    // Verify password (untuk sekarang, compare plain text karena belum di-hash)
    // TODO: Implement proper password verification dengan bcrypt
    if (user.password_hash !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last_login (non-blocking)
    try {
      await supabaseServer
        .from('sight_user_management')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)
    } catch (updateError) {
      // Log but don't fail login if update fails
      console.error('Failed to update last_login (non-critical):', updateError.message)
    }

    // Get IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Log activity (non-blocking - don't fail login if logging fails)
    try {
      await supabaseServer
        .from('sight_activity_log')
        .insert({
          user_name: user.name,
          user_id: user.id,
          action: 'Login',
          target: 'System',
          ip_address: ipAddress,
          user_agent: userAgent,
        })
    } catch (logError) {
      // Silently fail - activity log might not exist yet or there's a connection issue
      // Login should still succeed even if logging fails
      console.error('Failed to log activity (non-critical):', logError.message)
    }

    // Create session data
    const sessionData = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    // Set cookie untuk session (30 days)
    const cookieStore = await cookies()
    cookieStore.set('nexsight-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
