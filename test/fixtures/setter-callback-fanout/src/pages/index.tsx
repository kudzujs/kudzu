import { useState } from "@kudzujs/core"
import { Controls } from "../Controls"

export default function Page() {
  const [value, setValue] = useState("")
  return <main><output id="value">{value}</output><Controls onValueChange={setValue} /></main>
}
