import { useState } from "@kudzujs/core"
import { InvalidInput } from "../InvalidInput"

export default function Page() {
  const [value, setValue] = useState("initial")
  return <InvalidInput value={value} onValueChange={setValue} />
}
