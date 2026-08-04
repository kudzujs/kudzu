import { useState } from "react"
import { Adapter } from "../Adapter"

export default function Page() {
  const [value, setValue] = useState("")
  const [show] = useState(true)
  return <main><p>{value}</p><Adapter show={show} onValueChange={setValue} /></main>
}
