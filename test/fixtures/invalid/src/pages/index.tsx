import { useState } from "@kudzujs/core"

export default function InvalidPage() {
  const [count, setCount] = useState(0)
  const helper = () => 2

  function invalidEvent() {
    setCount(count + helper())
  }

  return <button onClick={invalidEvent}>{count}</button>
}
