import { useState } from "@kudzujs/core"

function format(value: number) {
  return String(value)
}

export default function Page() {
  const [count, setCount] = useState(0)
  const label = format(count)
  return <button onClick={() => setCount(count + 1)}>{label}</button>
}
