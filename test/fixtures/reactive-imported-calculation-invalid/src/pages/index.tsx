import { useState } from "@kudzujs/core"
import { calculate } from "../calculate"

export default function Page() {
  const [value, setValue] = useState(1)
  const result = calculate(value) as unknown as { total: number }
  return <button onClick={() => setValue(value + 1)}>{result.total}</button>
}
