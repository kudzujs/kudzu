export function calculateProjection(initialRevenue: number, growthRate: number, profitMargin: number, years: number) {
  const yearOneRevenue = Math.round(initialRevenue * (1 + growthRate / 100))
  const yearOneProfit = Math.round(yearOneRevenue * profitMargin / 100)
  const yearTwoRevenue = Math.round(yearOneRevenue * (1 + growthRate / 100))
  const yearTwoProfit = Math.round(yearTwoRevenue * profitMargin / 100)
  const yearThreeRevenue = Math.round(yearTwoRevenue * (1 + growthRate / 100))
  const yearThreeProfit = Math.round(yearThreeRevenue * profitMargin / 100)

  return {
    totalRevenue: years === 2 ? yearOneRevenue + yearTwoRevenue : yearOneRevenue + yearTwoRevenue + yearThreeRevenue,
    totalProfit: years === 2 ? yearOneProfit + yearTwoProfit : yearOneProfit + yearTwoProfit + yearThreeProfit,
    rows: years === 2
      ? [
          { year: 1, revenue: yearOneRevenue, profit: yearOneProfit },
          { year: 2, revenue: yearTwoRevenue, profit: yearTwoProfit }
        ]
      : [
          { year: 1, revenue: yearOneRevenue, profit: yearOneProfit },
          { year: 2, revenue: yearTwoRevenue, profit: yearTwoProfit },
          { year: 3, revenue: yearThreeRevenue, profit: yearThreeProfit }
        ]
  }
}
