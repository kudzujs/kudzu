import { useState } from "@kudzujs/core"
import { ShellB } from "../ShellB"

export const layout = ShellB

export default function Gamma() {
  const [count, setCount] = useState(0)
  return <main data-route="gamma"><h1>Gamma</h1><button data-route-count onClick={() => setCount(value => value + 1)}>Route {count}</button></main>
}
