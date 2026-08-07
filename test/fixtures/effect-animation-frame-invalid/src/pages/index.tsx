import { useEffect, useRef } from "react"

export default function InvalidAnimationFrame() {
  const rafRef = useRef(0)

  useEffect(() => {
    const update = () => {
      rafRef.current = 0
    }
    const requestUpdate = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", requestUpdate)
    return () => {
      window.removeEventListener("scroll", requestUpdate)
      const cancel = () => cancelAnimationFrame(rafRef.current)
      void cancel
    }
  }, [])

  return <main>Invalid animation frame cleanup</main>
}
