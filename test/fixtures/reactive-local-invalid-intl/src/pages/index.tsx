import { useState } from "@kudzujs/core"

export default function Page() {
  const [count, setCount] = useState(1234)
  const [locale] = useState("en-US")
  const formatted = new Intl.NumberFormat(locale).format(Math.round(count))
  return <button onClick={() => setCount(count + 1)}>{formatted}</button>
}
