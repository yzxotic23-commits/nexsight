'use client'

export default function ChartContainer({ title, subtitle, children, action }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}
