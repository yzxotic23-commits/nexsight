import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// GET - Fetch all users
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('sight_user_management')
      .select('id, name, email, username, role, status, last_login, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      )
    }

    // Format last_login untuk display
    const formattedData = data.map(user => ({
      ...user,
      lastLogin: user.last_login 
        ? formatLastLogin(user.last_login)
        : 'Never'
    }))

    return NextResponse.json({ data: formattedData, success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request) {
  try {
    const body = await request.json()
    const { fullName, email, username, password, role, status, created_by } = body

    // Validation
    if (!fullName || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Full name, email, username, and password are required' },
        { status: 400 }
      )
    }

    if (!['Admin', 'Manager', 'User'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be Admin, Manager, or User' },
        { status: 400 }
      )
    }

    // Hash password (dalam production, gunakan bcrypt atau library hashing yang proper)
    // Untuk sekarang, kita simpan plain text (TIDAK AMAN untuk production!)
    // TODO: Implement proper password hashing dengan bcrypt
    const passwordHash = password // TODO: Hash password dengan bcrypt

    const { data, error } = await supabaseServer
      .from('sight_user_management')
      .insert({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password_hash: passwordHash,
        role: role || 'User',
        status: status || 'Active',
        created_by: created_by || 'system',
      })
      .select('id, name, email, username, role, status, last_login, created_at, updated_at')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: 'Email already exists' },
            { status: 400 }
          )
        }
        if (error.message.includes('username')) {
          return NextResponse.json(
            { error: 'Username already exists' },
            { status: 400 }
          )
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to create user', details: error.message },
        { status: 500 }
      )
    }

    // Format response
    const formattedData = {
      ...data,
      lastLogin: data.last_login ? formatLastLogin(data.last_login) : 'Never'
    }

    // Log activity (non-blocking)
    try {
      await supabaseServer
        .from('sight_activity_log')
        .insert({
          user_name: created_by || 'system',
          user_id: null, // We don't have the creator's ID here
          action: 'Created User',
          target: 'User Management',
          details: { created_user: fullName, email, role }
        })
    } catch (logError) {
      // Silently fail - activity log might not exist yet
      console.error('Failed to log activity (non-critical):', logError.message)
    }

    return NextResponse.json({ 
      data: formattedData, 
      success: true, 
      message: 'User created successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to format last login
function formatLastLogin(timestamp) {
  const now = new Date()
  const loginTime = new Date(timestamp)
  const diffMs = now - loginTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return loginTime.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: loginTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
