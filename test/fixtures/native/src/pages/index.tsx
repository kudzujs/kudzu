import { useState } from "@kudzujs/core"

function NativeCounter({ increment }: { increment: number }) {
  const [count, setCount] = useState(0)
  const step = 2
  const offsets = [1]
  const limits = { minimum: 2 }

  async function update(event: MouseEvent) {
    const next = Math.max(count + step + increment + offsets[0], limits.minimum)
    if ((event.currentTarget as HTMLElement).dataset.enabled === "yes") {
      setCount(next)
      console.log("native", count)
    }
    await Promise.resolve("fetch-like")
    setCount(count + 1)
  }

  return <button data-enabled="yes" onClick={update}>{count}</button>
}

export default function NativeHandlerPage() {
  return <NativeCounter increment={1} />
}
