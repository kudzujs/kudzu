import { useEffect, useRef } from "react"

export default function InvalidCanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new IntersectionObserver(() => {})
    observer.observe(canvas)
  }, [])

  return <canvas ref={canvasRef} />
}
