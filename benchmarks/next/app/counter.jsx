"use client"

import { useState } from "react"

export default function Counter() {
  const [count, setCount] = useState(7)
  return <><button onClick={() => setCount(count - 1)}>-</button><strong>Count: {count}</strong><button onClick={() => setCount(count + 1)}>+</button></>
}
