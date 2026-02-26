import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

// Helper to generate random financial values
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min, max, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals))

// Market Processing Monitor Data
export const getMarketProcessingData = (month) => {
  const markets = ['MYR', 'SGD', 'USC']
  const totalTransactions = randomBetween(50000, 150000)
  const totalVolume = randomBetween(5000000, 50000000)

  const marketData = markets.map((market) => {
    const transactions = randomBetween(10000, 50000)
    const volume = randomBetween(1000000, 20000000)
    return {
      market,
      transactions,
      volume,
      contribution: (volume / totalVolume) * 100,
    }
  })

  // Normalize contributions to sum to 100%
  const totalContribution = marketData.reduce((sum, m) => sum + m.contribution, 0)
  marketData.forEach((m) => {
    m.contribution = (m.contribution / totalContribution) * 100
  })

  return {
    month: format(month.start, 'MMMM yyyy'),
    totalTransactions,
    totalVolume,
    markets: marketData,
  }
}

// Deposit Transaction Monitor Data
export const getDepositData = (month, currency = 'MYR') => {
  const currencyMultipliers = {
    MYR: { min: 100, max: 50000, symbol: 'RM' },
    SGD: { min: 30, max: 15000, symbol: 'S$' },
    USC: { min: 20, max: 10000, symbol: 'US$' },
  }

  const multiplier = currencyMultipliers[currency] || currencyMultipliers.MYR
  const totalCount = randomBetween(5000, 25000)
  const totalAmount = randomBetween(1000000 * multiplier.min, 50000000 * multiplier.min)
  const avgAmount = totalAmount / totalCount
  const avgProcessingTime = randomFloat(0.5, 5.0, 1)

  // Daily breakdown for the month
  const days = eachDayOfInterval({ start: month.start, end: month.end })
  const dailyData = days.map((day) => ({
    date: format(day, 'yyyy-MM-dd'),
    count: randomBetween(100, 1000),
    amount: randomBetween(50000 * multiplier.min, 2000000 * multiplier.min),
  }))

  return {
    month: format(month.start, 'MMMM yyyy'),
    currency,
    currencySymbol: multiplier.symbol,
    totalCount,
    totalAmount,
    avgAmount,
    avgProcessingTime,
    dailyData,
  }
}

// Withdraw Transaction Monitor Data
export const getWithdrawData = (month, currency = 'MYR') => {
  const currencyMultipliers = {
    MYR: { min: 100, max: 50000, symbol: 'RM' },
    SGD: { min: 30, max: 15000, symbol: 'S$' },
    USC: { min: 20, max: 10000, symbol: 'US$' },
  }

  const multiplier = currencyMultipliers[currency] || currencyMultipliers.MYR
  const totalCount = randomBetween(3000, 15000)
  const totalAmount = randomBetween(500000 * multiplier.min, 30000000 * multiplier.min)
  const avgAmount = totalAmount / totalCount

  // Daily breakdown
  const days = eachDayOfInterval({ start: month.start, end: month.end })
  const dailyData = days.map((day) => ({
    date: format(day, 'yyyy-MM-dd'),
    count: randomBetween(50, 600),
    amount: randomBetween(25000 * multiplier.min, 1500000 * multiplier.min),
  }))

  return {
    month: format(month.start, 'MMMM yyyy'),
    currency,
    currencySymbol: multiplier.symbol,
    totalCount,
    totalAmount,
    avgAmount,
    dailyData,
  }
}

// Wealth+ Account Production Monitor Data
export const getWealthAccountProductionData = (month) => {
  const currentMonth = randomBetween(500, 2000)
  const previousMonth = randomBetween(400, 1800)
  const growthRate = ((currentMonth - previousMonth) / previousMonth) * 100

  // Daily breakdown
  const days = eachDayOfInterval({ start: month.start, end: month.end })
  const dailyData = days.map((day) => ({
    date: format(day, 'yyyy-MM-dd'),
    accounts: randomBetween(10, 80),
  }))

  return {
    month: format(month.start, 'MMMM yyyy'),
    totalAccounts: currentMonth,
    previousMonthAccounts: previousMonth,
    growthRate,
    dailyData,
  }
}

// Wealth+ Account Status/Output Data
export const getWealthAccountStatusData = (month) => {
  const totalAccounts = randomBetween(10000, 50000)
  const activeAccounts = randomBetween(7000, totalAccounts * 0.9)
  const outputVolume = randomBetween(1000000, 10000000)
  const utilizationRatio = (activeAccounts / totalAccounts) * 100

  return {
    month: format(month.start, 'MMMM yyyy'),
    totalAccounts,
    activeAccounts,
    outputVolume,
    utilizationRatio,
  }
}

// Bank Account Rental & Usage Monitor Data
export const getBankAccountData = (month) => {
  const totalRented = randomBetween(500, 3000)
  const previousMonthRented = randomBetween(400, 2500)
  const rentalTrend = ((totalRented - previousMonthRented) / previousMonthRented) * 100

  const totalUsageAmount = randomBetween(50000000, 500000000)
  const avgUsagePerAccount = totalUsageAmount / totalRented
  const usageEfficiencyRatio = randomFloat(60, 95, 1)

  // Monthly trend (last 6 months)
  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const trendMonth = subMonths(month.start, i)
    monthlyTrend.push({
      month: format(trendMonth, 'MMM yyyy'),
      rented: randomBetween(300, 2500),
      usage: randomBetween(30000000, 450000000),
    })
  }

  return {
    month: format(month.start, 'MMMM yyyy'),
    totalRented,
    previousMonthRented,
    rentalTrend,
    totalUsageAmount,
    avgUsagePerAccount,
    usageEfficiencyRatio,
    monthlyTrend,
  }
}
