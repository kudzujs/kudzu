import { useCallback, useEffect, useRef, useState } from "react"

const usePulse = () => {
  const [pending, setPending] = useState(false)
  const timer = useRef<number | null>(null)
  const pulse = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setPending(true)
    timer.current = setTimeout(() => setPending(false), 40)
  }, [])
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  return { pending, setPending, pulse }
}

export default usePulse
