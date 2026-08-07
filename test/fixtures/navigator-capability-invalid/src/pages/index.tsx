import { useState } from "react"

export default function InvalidCapability() {
  const [count] = useState(0)
  const supported = "share" in navigator
  const branch = supported && <button>Share {count}</button>

  return <main>{branch}</main>
}
