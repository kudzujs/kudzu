import { useState } from "@kudzujs/core"
export { ShellA as layout } from "../ShellA"
import "../styles/alpha.css"

export default function Alpha() {
  const [count, setCount] = useState(0)
  return <main data-route="alpha"><h1>Alpha</h1><button data-route-count onClick={() => setCount(value => value + 1)}>Route {count}</button></main>
}
