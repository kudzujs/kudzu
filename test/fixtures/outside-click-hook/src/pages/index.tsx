import { useState } from "react"
import { Dropdown } from "../Dropdown"

export default function Page() {
  const [mounted, setMounted] = useState(true)
  return <main>
    <button id="mount-toggle" onClick={() => setMounted(!mounted)}>Toggle dropdown</button>
    <button id="outside">Outside</button>
    {mounted && <Dropdown />}
  </main>
}
