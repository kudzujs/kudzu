import { useState } from "@kudzujs/core"
import { ArrayInput } from "../ArrayInput"

export default function Page() {
  const [value, setValue] = useState(["initial"])
  return <ArrayInput value={value} onValueChange={setValue} />
}
