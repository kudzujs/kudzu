import { useState } from "react"

function Counter() {
  const [count, setCount] = useState(0)
  return <button data-initial-owned onClick={() => setCount(count + 1)}>Initial: {count}</button>
}

export default function InitialPage() {
  const [shown] = useState(true)
  return <main>{shown && <Counter />}</main>
}
