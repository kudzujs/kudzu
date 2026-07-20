import { useState } from "@kudzujs/core"

export default function Counter() {
  const [count, setCount] = useState(7)

  function decrease() {
    setCount(count - 1)
  }

  function increase() {
    setCount(count + 1)
  }

  return (
    <main>
      <h1>Counter</h1>
      <button onClick={decrease}>-</button>
      <strong>Count: {count}</strong>
      <button onClick={increase}>+</button>
    </main>
  )
}
