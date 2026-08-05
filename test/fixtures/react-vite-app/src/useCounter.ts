import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

export function useCounter() {
  const [count, setCount] = useState(0)
  const [status, setStatus] = useState("ready")
  const [offset, setOffset] = useState(1)
  const [selection, setSelection] = useState<string | null>("chosen")
  const [storageReady, setStorageReady] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const increment = useCallback(() => {
    const nextCount = count + 1
    setCount(nextCount)
    setStatus("changed")
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      next.set("count", String(nextCount))
      return next
    }, { replace: true })
  }, [count])
  const reset = useCallback(() => {
    setCount(0)
    setStatus("ready")
    setOffset(-1)
    setSelection(null)
  }, [])
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(count))
      setStatus("copied")
    } catch {
      setStatus("copy failed")
    }
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
  return { count, setCount, status, setStatus, offset, setOffset, selection, setSelection, increment, reset, copy }
}
