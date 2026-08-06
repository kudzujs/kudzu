import { useCallback, useEffect, useRef, useState } from "react"

export function useFlash() {
  const [active, setActive] = useState(false)
  const timer = useRef<number | null>(null)
  const delay = 100
  const flash = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setActive(true)
    timer.current = setTimeout(() => setActive(false), delay)
  }, [])
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  return { active, setActive, flash }
}
