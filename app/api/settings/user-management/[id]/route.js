import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// GET - Fetch single user by ID
export async function GET(request, { params }) {
  try {
    const { id } = params

    const { data, error } = await supabaseServer
      .from('sight_user_management')
      .select('id, name, email, username, role, status, last_login, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Format last_login
    const formattedData = {
      ...data,
      lastLogin: data.last_login ? formatLastLogin(data.last_login) : 'Never'
    }

    return NextResponse.json({ data: formattedData, success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { fullName, email, username, password, role, status, updated_by } = body

    // Check if user is the default admin (username: admin)
    const { data: existingUser } = await supabaseServer
      .from('sight_user_management')
      .select('username')
      .eq('id', id)
      .single()

    if (existingUser && existingUser.username === 'admin') {
      return NextResponse.json(
        { error: 'Default admin user cannot be edited' },
        { status: 403 }
      )
    }

    // Validation
    if (role && !['Admin', 'Manager', 'User'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be Admin, Manager, or User' },
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
    if (fullName) updateData.name = fullName.trim()
    if (email) updateData.email = email.trim().toLowerCase()
    if (username) updateData.username = username.trim().toLowerCase()
    if (role) updateData.role = role
    if (status) updateData.status = status
    if (password) {
      // TODO: Hash password dengan bcrypt
      updateData.password_hash = password
    }
    if (updated_by) updateData.updated_by = updated_by

    const { data, error } = await supabaseServer
      .from('sight_user_management')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, username, role, status, last_login, created_at, updated_at')
      .single()

    if (error) {
      console.error('Error updating user:', error)
      
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
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Format last_login
    const formattedData = {
      ...data,
      lastLogin: data.last_login ? formatLastLogin(data.last_login) : 'Never'
    }

    return NextResponse.json({ 
      data: formattedData, 
      success: true, 
      message: 'User updated successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Check if user is the default admin (username: admin)
    const { data: existingUser } = await supabaseServer
      .from('sight_user_management')
      .select('username')
      .eq('id', id)
      .single()

    if (existingUser && existingUser.username === 'admin') {
      return NextResponse.json(
        { error: 'Default admin user cannot be deleted' },
        { status: 403 }
      )
    }

    const { error } = await supabaseServer
      .from('sight_user_management')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json(
        { error: 'Failed to delete user', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
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
