import { useState } from "@kudzujs/core"
import { helper } from "../helper"

export default function InvalidClientRequirePage() {
  const [value, setValue] = useState(0)
  return <button onClick={() => setValue(helper())}>{value}</button>
}
