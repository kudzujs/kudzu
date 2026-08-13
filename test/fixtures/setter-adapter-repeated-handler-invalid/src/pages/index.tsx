import { useState } from "@kudzujs/core"
import { Adapter } from "../Adapter"

export default function Page() {
  const [value, setValue] = useState("")
  console.log(value)
  return <Adapter onValueChange={setValue} />
}
