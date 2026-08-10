import { useEffect, useRef, useState } from "react"
import { openTerminal, type TerminalHandle } from "../terminal"

export default function TerminalPage() {
  const [status, setStatus] = useState("starting")
  const handleRef = useRef<TerminalHandle | null>(null)
  const generationRef = useRef(0)

  useEffect(() => {
    const generation = ++generationRef.current
    let active = true

    void openTerminal().then(handle => {
      if (!active || generation !== generationRef.current) {
        handle.close()
        return
      }
      handleRef.current = handle
      setStatus("ready")
    })

    const onPageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return
      generationRef.current += 1
      handleRef.current?.close()
      handleRef.current = null
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) handleRef.current?.resume()
    }

    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("pageshow", onPageShow)
    return () => {
      active = false
      generationRef.current += 1
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("pageshow", onPageShow)
      handleRef.current?.close()
      handleRef.current = null
    }
  }, [])

  return <main><h1>Terminal</h1><p>{status}</p></main>
}
