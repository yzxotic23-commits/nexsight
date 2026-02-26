'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { login } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/toast-context'
import { ArrowRight, TrendingUp, Shield, BarChart3, Zap, Users, CreditCard, Activity, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()
  const modalRef = useRef(null)

  // Hide scrollbar on landing page
  useEffect(() => {
    document.body.classList.add('hide-scrollbar')
    return () => {
      document.body.classList.remove('hide-scrollbar')
    }
  }, [])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsLoginModalOpen(false)
      }
    }
    if (isLoginModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isLoginModalOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(username, password)

      if (result?.success) {
        localStorage.setItem('showLoginSuccessToast', 'true')
        setIsLoginModalOpen(false)
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.href = '/dashboard'
      } else {
        setError('Login failed. Please try again.')
        showToast('Login failed. Please try again.', 'error')
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials')
      showToast(err.message || 'Login failed. Please check your credentials.', 'error')
    } finally {
      setLoading(false)
    }
  }
  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Monitor your financial data with real-time KPI dashboards and comprehensive analytics.',
    },
    {
      icon: TrendingUp,
      title: 'Transaction Monitoring',
      description: 'Track deposits and withdrawals across multiple markets (MYR, SGD, USC) with detailed insights.',
    },
    {
      icon: Users,
      title: 'Account Management',
      description: 'Manage bank account rentals and monitor account production with comprehensive tracking.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with encrypted data and secure authentication.',
    },
    {
      icon: Zap,
      title: 'Fast Performance',
      description: 'Lightning-fast dashboard with optimized performance for real-time data processing.',
    },
    {
      icon: Activity,
      title: 'Custom Reports',
      description: 'Generate custom reports and insights tailored to your business needs.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#1e1e1e] dark:via-[#2e2e2e] dark:to-[#1e1e1e]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#3d3d3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/logo/eyes.png"
                alt="NexSight Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">NexSight</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-gray-900 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center -mb-24">
              <Image
                src="/logo/nexsight-transparent-2.png"
                alt="NexSight Logo"
                width={500}
                height={500}
                className="h-64 w-64 sm:h-80 sm:w-80 lg:h-96 lg:w-96 object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 -mt-24">
              Modern KPI Dashboard
              <br />
              <span className="text-gold-500">for Financial Monitoring</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-2 mt-0">
              Monitor your financial transactions, track account performance, and gain real-time insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center justify-center px-8 py-4 bg-gold-500 hover:bg-gold-600 text-gray-900 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-[#252525] text-gray-900 dark:text-white border-2 border-gray-300 dark:border-[#3d3d3d] rounded-xl font-semibold text-lg transition-all hover:bg-gray-50 dark:hover:bg-[#2d2d2d]"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-[#252525]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Powerful Features
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to monitor and manage your financial operations in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="p-6 bg-white dark:bg-[#252525] rounded-2xl shadow-lg border border-gray-200 dark:border-[#3d3d3d] hover:shadow-xl transition-all hover:scale-105"
                >
                  <div className="w-12 h-12 bg-gold-500/10 dark:bg-gold-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-gold-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white dark:bg-[#252525] rounded-2xl shadow-lg border border-gray-200 dark:border-[#3d3d3d]">
              <div className="text-4xl font-bold text-gold-500 mb-2">100%</div>
              <div className="text-gray-600 dark:text-gray-300">Real-time Data</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-[#252525] rounded-2xl shadow-lg border border-gray-200 dark:border-[#3d3d3d]">
              <div className="text-4xl font-bold text-gold-500 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-300">Monitoring</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-[#252525] rounded-2xl shadow-lg border border-gray-200 dark:border-[#3d3d3d]">
              <div className="text-4xl font-bold text-gold-500 mb-2">Multi</div>
              <div className="text-gray-600 dark:text-gray-300">Market Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gold-500 to-gold-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-lg text-gray-900/90 mb-6">
            Start monitoring your financial operations today with NexSight Dashboard.
          </p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Sign In Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#1e1e1e]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image
              src="/logo/eyes.png"
              alt="NexSight Logo"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="text-lg font-bold text-gray-900 dark:text-white">NexSight</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} NexSight Dashboard. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="relative w-full max-w-sm mx-4 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#3d3d3d]"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Login Form */}
            <div className="px-8 pt-8 pb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Sign in to continue</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
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
                    className="w-full px-4 py-2.5 border border-[#e5e5e6] dark:border-[#3d3d3d] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    autoFocus
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
                    className="w-full px-4 py-2.5 border border-[#e5e5e6] dark:border-[#3d3d3d] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gold-500 hover:bg-gold-600 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Default credentials: admin / admin</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
