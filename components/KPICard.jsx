'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KPICard({ title, value, change, changeLabel = 'vs Last Month', icon: Icon, trend = 'up', iconColor, iconBg, titleAlign = 'left' }) {
  const isPositive = trend === 'up' && change >= 0
  const isNegative = trend === 'down' || change < 0
  const showChange = trend !== 'neutral'

  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-full ${iconBg || 'bg-gold-100 dark:bg-gold-900/20'}`}>
            <Icon className={`w-5 h-5 ${iconColor || 'text-gold-500'}`} />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {showChange && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-300 ml-1">{changeLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
