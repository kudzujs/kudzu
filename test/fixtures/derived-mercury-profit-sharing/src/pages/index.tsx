import { useEffect, useState } from "react"
import { calculateProjection } from "../calculate"

export default function ProfitSharing() {
  const [initialRevenue, setInitialRevenue] = useState(1000)
  const [growthRate, setGrowthRate] = useState(10)
  const [profitMargin, setProfitMargin] = useState(20)
  const [years, setYears] = useState(2)
  const projection = calculateProjection(initialRevenue, growthRate, profitMargin, years)

  useEffect(() => {
    document.body.dataset.totalProfit = String(projection.totalProfit)
  }, [projection.totalProfit])

  return <main>
    <button onClick={() => setInitialRevenue(2000)}>Double revenue</button>
    <button onClick={() => setGrowthRate(20)}>Increase growth</button>
    <button onClick={() => setProfitMargin(25)}>Increase margin</button>
    <button onClick={() => setYears(3)}>Three years</button>
    <button onClick={() => setYears(2)}>Two years</button>
    <output data-revenue>{projection.totalRevenue}</output>
    <output data-profit>{projection.totalProfit}</output>
    <ol>
      {projection.rows.map(row => <li key={row.year} data-year={row.year}>{row.revenue}:{row.profit}</li>)}
    </ol>
  </main>
}
