'use client'

import { useState, useEffect } from 'react'
import { getSession } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSession() {
      try {
        const session = await getSession()
        setUser(session)
      } catch (error) {
        console.error('Error fetching session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()

    // Refresh session setiap 5 menit
    const interval = setInterval(fetchSession, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { user, loading }
}
