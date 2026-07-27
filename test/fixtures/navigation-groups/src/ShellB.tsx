import { useState } from "@kudzujs/core"

export function ShellB({ children }: { children?: unknown }) {
  const [count, setCount] = useState(0)
  return <div data-shell="b">
    <button data-layout-count onClick={() => setCount(value => value + 1)}>B {count}</button>
    <nav><a data-beta href="/app/beta">Beta</a><a data-gamma href="/app/gamma">Gamma</a><a data-outside href="/app/outside">Outside</a></nav>
    {children}
  </div>
}
