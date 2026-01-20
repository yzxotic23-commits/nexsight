'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useThemeStore } from '@/lib/stores/themeStore'
import { useToast } from '@/lib/toast-context'
import { useEffect, useState } from 'react'

const getToastStyles = (isDark) => ({
  success: {
    bg: isDark
      ? 'bg-gradient-to-br from-green-600/25 to-green-500/15'
      : 'bg-gradient-to-br from-green-500/15 to-green-400/10',
    border: 'border-green-500/50',
    icon: 'text-green-500',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    glow: 'shadow-lg shadow-green-500/20',
  },
  error: {
    bg: isDark
      ? 'bg-gradient-to-br from-red-500/30 to-red-600/20'
      : 'bg-gradient-to-br from-red-500/20 to-red-600/15',
    border: 'border-red-500/60',
    icon: 'text-red-500',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    glow: 'shadow-lg shadow-red-500/20',
  },
  info: {
    bg: isDark
      ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/20'
      : 'bg-gradient-to-br from-blue-500/20 to-blue-600/15',
    border: 'border-blue-500/60',
    icon: 'text-blue-500',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    glow: 'shadow-lg shadow-blue-500/20',
  },
  warning: {
    bg: isDark
      ? 'bg-gradient-to-br from-yellow-500/30 to-amber-500/20'
      : 'bg-gradient-to-br from-yellow-500/20 to-amber-500/15',
    border: 'border-yellow-500/60',
    icon: 'text-yellow-500',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    glow: 'shadow-lg shadow-yellow-500/20',
  },
})

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return CheckCircle2
    case 'error':
      return AlertCircle
    case 'warning':
      return AlertTriangle
    default:
      return Info
  }
}

function ToastItem({ toast }) {
  const { theme } = useThemeStore()
  const { removeToast } = useToast()
  const [progress, setProgress] = useState(100)

  const isDark = theme === 'dark'
  const styles = getToastStyles(isDark)[toast.type]
  const Icon = getIcon(toast.type)

  useEffect(() => {
    const duration = toast.duration || 4000
    const interval = 50
    const decrement = (100 / duration) * interval

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement
        return next <= 0 ? 0 : next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [toast.duration])

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`
        relative min-w-[320px] max-w-[420px] rounded-xl border backdrop-blur-md
        ${styles.bg} ${styles.border} ${styles.glow}
        overflow-hidden
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={`flex-1 ${styles.text} text-sm font-medium`}>
          {toast.message}
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className={`
            flex-shrink-0 rounded-lg p-1 transition-colors
            ${styles.text} hover:bg-black/10 dark:hover:bg-white/10
          `}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10 dark:bg-white/10">
        <motion.div
          className={`h-full ${getProgressBarColor()}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()
  const { theme } = useThemeStore()

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
