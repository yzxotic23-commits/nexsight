'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/toast-context'
import { useSession } from 'next-auth/react'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials')
        showToast('Login failed. Please check your credentials.', 'error')
      } else if (result?.ok) {
        // Set flag untuk menampilkan toast setelah masuk dashboard
        localStorage.setItem('showLoginSuccessToast', 'true')
        // Wait a bit for session to be created
        await new Promise(resolve => setTimeout(resolve, 500))
        // Force reload to ensure session is available
        window.location.href = '/dashboard'
      } else {
        setError('Login failed. Please try again.')
        showToast('Login failed. Please try again.', 'error')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      showToast('An error occurred. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f6f5f4] dark:bg-[#191919] pt-8 pb-8 relative">
      {/* Theme Toggle - Top Right Corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Logo Header - Landing Page Style */}
      <div className="text-center mb-0">
        <img 
          src="/logo/nexsight-transparent-2.png" 
          alt="NexSight Logo" 
          className="h-96 w-96 mx-auto object-contain"
        />
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md p-8 bg-white dark:bg-[#1e1e1e] rounded-lg shadow-lg border border-[#e5e5e6] dark:border-[#3d3d3d] -mt-24 transition-none">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Sign in to continue</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#e5e5e6] dark:border-[#3d3d3d] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#e5e5e6] dark:border-[#3d3d3d] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Default credentials: admin / admin</p>
        </div>
      </div>
    </div>
  )
}
