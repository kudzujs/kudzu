import { useState } from "@kudzujs/core"

export default function CommandPage() {
  const [count, setCount] = useState(0)
  return <main>
    <output>{count}</output>
    <button onClick={() => setCount(count + 1)}>Direct</button>
    <button onClick={() => { const next = count + 1; setCount(next) }}>Alias</button>
    <button onClick={() => { const increment = () => setCount(count + 1); increment() }}>Arrow</button>
    <button onClick={() => { function increment(value: number) { setCount(value + 1) }; increment(count) }}>Function</button>
  </main>
}
