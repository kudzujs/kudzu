export type ChartFrame = {
  batchSize: number
  buffered: number
  generated: number
  elapsed: number
  points: number[]
}

export function createChart(canvas: HTMLCanvasElement) {
  let disposed = false
  const context = canvas.getContext("2d")
  return {
    render(frame: ChartFrame) {
      if (disposed) return
      context?.clearRect(0, 0, canvas.width, canvas.height)
      context?.beginPath()
      const minimum = Math.min(...frame.points)
      const range = Math.max(1, Math.max(...frame.points) - minimum)
      frame.points.forEach((point, index) => {
        const x = frame.points.length > 1 ? index * canvas.width / (frame.points.length - 1) : 0
        const y = canvas.height - (point - minimum) * canvas.height / range
        if (index) context?.lineTo(x, y)
        else context?.moveTo(x, y)
      })
      context?.stroke()
      canvas.dataset.renders = String(Number(canvas.dataset.renders ?? 0) + 1)
      canvas.dataset.batchSize = String(frame.batchSize)
      canvas.dataset.buffered = String(frame.buffered)
      canvas.dataset.generated = String(frame.generated)
      canvas.dataset.elapsed = String(frame.elapsed)
      canvas.dataset.points = String(frame.points.length)
    },
    dispose() {
      disposed = true
      context?.clearRect(0, 0, canvas.width, canvas.height)
      canvas.dataset.disposed = "true"
    }
  }
}
