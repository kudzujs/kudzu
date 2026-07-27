import { useEffect } from "@kudzujs/core"
import { mountChart } from "../chart"
import { Shell } from "../Shell"

export const layout = Shell
export const metadata = { title: "Chart probe" }

export default function Chart() {
  useEffect(() => {
    const chart = mountChart(document.querySelector("[data-chart]") as HTMLElement)
    return () => chart.dispose()
  }, [])

  return <main data-route="chart">
    <h1>Chart probe</h1>
    <div data-chart data-sample="0" />
    <a data-ordinary href="/shop/cart">Ordinary route</a>
  </main>
}
