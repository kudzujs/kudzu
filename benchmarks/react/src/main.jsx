import React, { useState } from "react"
import { createRoot } from "react-dom/client"

function Counter() {
  const [count, setCount] = useState(7)
  return <main><h1>Counter</h1><button onClick={() => setCount(count - 1)}>-</button><strong>Count: {count}</strong><button onClick={() => setCount(count + 1)}>+</button></main>
}

createRoot(document.getElementById("root")).render(<Counter />)
