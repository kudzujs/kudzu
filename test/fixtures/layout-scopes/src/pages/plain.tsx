import { useState } from "@kudzujs/core"

export default function PlainPage() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Count {count}</button>
}
