import { useEffect, useState } from "@kudzujs/core"

function formatCount(count: number) {
  return `count:${count}`
}

export default function Page() {
  const [count, setCount] = useState(0)
  const label = formatCount(count)

  useEffect(() => {
    console.log(label)
  }, [label])

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
