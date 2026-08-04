import { useState } from "@kudzujs/core"
import { InvalidInput } from "../InvalidInput"

export default function Page() {
  const [value, setValue] = useState("initial")
  return <main><InvalidInput value={value} onValueChange={setValue} /></main>
}
