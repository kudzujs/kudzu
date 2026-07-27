import { useEffect } from "@kudzujs/core"
import { createChart, type ChartFrame } from "../chart"
import { Shell } from "../Shell"

export const layout = Shell

export default function Dashboard() {
  useEffect(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("[data-chart]")!
    const chart = createChart(canvas)
    const worker = new Worker(
      new URL("../telemetry.worker.ts", import.meta.url),
      { type: "module" },
    )
    let active = true
    const onMessage = (event: MessageEvent<ChartFrame>) => {
      if (active) chart.render(event.data)
    }
    const onError = () => {
      if (active) canvas.dataset.workerError = "true"
    }
    worker.addEventListener("message", onMessage)
    worker.addEventListener("error", onError)

    return () => {
      active = false
      worker.removeEventListener("message", onMessage)
      worker.removeEventListener("error", onError)
      worker.terminate()
      chart.dispose()
    }
  }, [])

  return <main data-route="dashboard">
    <h1>Realtime dashboard</h1>
    <canvas data-chart data-renders="0" aria-label="Telemetry chart" />
    <noscript>Telemetry requires JavaScript. The dashboard shell remains available.</noscript>
  </main>
}
