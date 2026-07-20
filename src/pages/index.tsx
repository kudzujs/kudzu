import { useState } from "@kudzujs/core"

export const metadata = { title: "Kudzu" }

export default function HomePage() {
  const [count, setCount] = useState(0)

  function increase() {
    setCount(count + 1)
  }

  function increaseTwice() {
    setCount(count + 1)
    setCount(count + 1)
  }

  return (
    <main>
      <p className="eyebrow">KUDZU STARTER</p>
      <h1>React-shaped TSX.<br />HTML-first output.</h1>
      <p className="intro">Edit <code>src/pages/index.tsx</code> to start building.</p>
      <div className="counter">
        <button onClick={increase}>Increase</button>
        <strong>{count}</strong>
        <button onClick={increaseTwice}>Increase twice</button>
      </div>
    </main>
  )
}
