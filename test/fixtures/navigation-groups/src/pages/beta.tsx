import { useState } from "@kudzujs/core"
import { ShellB } from "../ShellB"

export const layout = ShellB

export default function Beta() {
  const [count, setCount] = useState(0)
  return <main data-route="beta"><h1>Beta</h1><button data-route-count onClick={() => setCount(value => value + 1)}>Route {count}</button></main>
}
