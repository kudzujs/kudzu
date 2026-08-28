import Chart from "chart.js/auto"
import { useEffect, useRef, useState } from "react"
import { Shell } from "../Shell"

export const layout = Shell

export default function AnalyticsChart() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const chart = useRef<any>(null)
  const [value, setValue] = useState(3)

  useEffect(() => {
    const host = canvas.current
    const context = host?.getContext("2d")
    if (!host || !context) return
    const instance = new Chart(context, {
      type: "doughnut",
      data: { labels: ["Active", "Invited", "Inactive"], datasets: [{ data: [value, 2, 1] }] },
      options: { animation: false, responsive: false },
    })
    chart.current = instance
    host.dataset.chartId = String(instance.id)
    document.body.dataset.chartMounts = String(Number(document.body.dataset.chartMounts || "0") + 1)
    const onResize = () => {
      instance.resize()
      host.dataset.resizes = String(Number(host.dataset.resizes || "0") + 1)
    }
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      instance.destroy()
      chart.current = null
      host.dataset.disposed = "true"
      document.body.dataset.chartDisposals = String(Number(document.body.dataset.chartDisposals || "0") + 1)
    }
  }, [])

  useEffect(() => {
    const instance = chart.current
    const host = canvas.current
    if (!instance || !host) return
    instance.data.datasets[0].data = [value, 2, 1]
    instance.update("none")
    host.dataset.value = String(value)
    host.dataset.updates = String(Number(host.dataset.updates || "0") + 1)
  }, [value])

  return <main data-route="chart">
    <h1>Team activity</h1>
    <button data-update-chart onClick={() => setValue(value + 1)}>Add active user</button>
    <output data-chart-value>{value}</output>
    <canvas data-chart ref={canvas} role="img" aria-label="Team activity doughnut chart"></canvas>
  </main>
}
