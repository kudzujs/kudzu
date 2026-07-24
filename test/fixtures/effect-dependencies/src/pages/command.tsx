import { useState } from "@kudzujs/core"

export default function CommandPage() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
