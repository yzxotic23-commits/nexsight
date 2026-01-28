'use client'

// Client-side auth helper functions
export async function login(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Login failed')
  }

  return data
}

export async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Logout failed')
  }

  return data
}

export async function getSession() {
  try {
    const response = await fetch('/api/auth/session')
    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}
