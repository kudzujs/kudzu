import { useState } from "@kudzujs/core"
import { InvalidInput } from "../InvalidInput"

export default function Page() {
  const [value, setValue] = useState("")
  return <main><p>{value}</p><InvalidInput onValueChange={setValue} /></main>
}
