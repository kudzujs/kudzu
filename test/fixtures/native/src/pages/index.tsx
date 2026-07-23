import { useState } from "@kudzujs/core"
import offset, { clamp as Math } from "../helpers"
import * as helpers from "../helpers"

function NativeCounter({ increment }: { increment: number }) {
  const [count, setCount] = useState(0)
  const step = 2
  const offsets = [1]
  const limits = { minimum: 2 }

  async function update(event: MouseEvent) {
    const next = Math(count + step + increment + offsets[0] + offset(), limits.minimum) + helpers.bonus()
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
