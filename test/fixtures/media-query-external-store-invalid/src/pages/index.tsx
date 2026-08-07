import { useSyncExternalStore } from "react"

export default function InvalidMediaQuery() {
  const matches = useSyncExternalStore(
    callback => {
      const media = window.matchMedia("(max-width: 768px)")
      media.addEventListener("change", callback)
      return () => media.removeEventListener("resize", callback)
    },
    () => window.matchMedia("(max-width: 768px)").matches,
    () => false
  )

  return <main>{matches ? "Mobile" : "Desktop"}</main>
}
