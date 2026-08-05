import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

export function useCounter() {
  const [count, setCount] = useState(0)
  const [storageReady, setStorageReady] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const increment = useCallback(() => {
    const nextCount = count + 1
    setCount(nextCount)
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      next.set("count", String(nextCount))
      return next
    }, { replace: true })
  }, [count])
  useEffect(() => {
    try {
      const raw = globalThis.localStorage.getItem("kudzu-counter")
      const stored = raw === null || raw.trim() === "" ? NaN : Number(raw)
      if (Number.isFinite(stored)) setCount(stored)
    } catch {
    } finally {
      setStorageReady(true)
    }
  }, [])
  useEffect(() => {
    if (!storageReady) return
    try {
      globalThis.localStorage.setItem("kudzu-counter", String(count))
    } catch {}
  }, [storageReady, count])
  return { count, setCount, increment }
}
