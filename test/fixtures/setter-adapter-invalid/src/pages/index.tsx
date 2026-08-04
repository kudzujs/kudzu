import { useState } from "@kudzujs/core"
import { Adapter } from "../Adapter"

export default function Page() {
  const [value, setValue] = useState("")
  return <main><p>{value}</p><Adapter onValueChange={setValue} /></main>
}
