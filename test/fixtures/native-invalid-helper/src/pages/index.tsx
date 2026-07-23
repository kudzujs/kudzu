import { useState } from "@kudzujs/core"
import { helper } from "../helper"

export default function InvalidClientHelperPage() {
  const [value, setValue] = useState(0)
  return <button onClick={() => setValue(helper())}>{value}</button>
}
