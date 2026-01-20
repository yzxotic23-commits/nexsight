// Currency formatter
export const formatCurrency = (amount, currency = 'MYR', symbol = null) => {
  const symbols = {
    MYR: 'RM',
    SGD: 'S$',
    USC: 'US$',
    ALL: '', // No symbol for aggregated data
  }

  const currencySymbol = symbol || symbols[currency] || 'RM'
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return currencySymbol ? `${currencySymbol} ${formatted}` : formatted
}

// Number formatter
export const formatNumber = (num, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

// Percentage formatter
export const formatPercentage = (value, decimals = 2) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

// Abbreviate large numbers
export const abbreviateNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
