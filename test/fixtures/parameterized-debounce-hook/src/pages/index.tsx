import { useState } from "react"
import { Search } from "../Search"

export default function Page() {
  const [shown, setShown] = useState(true)
  return <main>
    <button id="toggle" onClick={() => setShown(!shown)}>Toggle</button>
    {shown && <Search />}
  </main>
}
