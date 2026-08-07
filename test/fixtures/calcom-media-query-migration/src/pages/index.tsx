import { useSyncExternalStore } from "react"

export default function ResponsiveBooker() {
  const isMobile = useSyncExternalStore(
    callback => {
      const media = window.matchMedia("(max-width: 768px)")
      media.addEventListener("change", callback)
      return () => media.removeEventListener("change", callback)
    },
    () => window.matchMedia("(max-width: 768px)").matches,
    () => false
  )
  const isTablet = useSyncExternalStore(
    callback => {
      const media = window.matchMedia("(max-width: 1024px)")
      media.addEventListener("change", callback)
      return () => media.removeEventListener("change", callback)
    },
    () => window.matchMedia("(max-width: 1024px)").matches,
    () => false
  )
  const layout = isMobile ? "mobile" : "column"
  const visibleDays = isTablet ? 4 : 7

  return <main data-layout={layout}>
    <h1>Book a time</h1>
    <p id="layout">{layout}</p>
    <p id="visible-days">{visibleDays} visible days</p>
  </main>
}
