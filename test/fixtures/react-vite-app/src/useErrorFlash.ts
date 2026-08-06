import { useCallback, useEffect, useRef, useState } from "react"

export function useErrorFlash() {
  const [flashing, setFlashing] = useState(false)
  const timer = useRef<number | null>(null)
  const flash = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setFlashing(true)
    timer.current = setTimeout(() => {
      document.body.dataset.errorFlashCount = String(Number(document.body.dataset.errorFlashCount ?? "0") + 1)
      setFlashing(false)
    }, 100)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return { flashing, setFlashing, flash }
}
