import { useState } from "@kudzujs/core"

export default function OtherNativeHandlerPage() {
  const [count, setCount] = useState(0)
  return <button onClick={async () => {
    await Promise.resolve()
    setCount(count + 1)
  }}>Other {count}</button>
}
