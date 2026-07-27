import { useEffect, useState } from "@kudzujs/core"

export function ShellA({ children }: { children?: unknown }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    document.body.dataset.layoutMounts = String(Number(document.body.dataset.layoutMounts ?? 0) + 1)
  }, [])
  return <div data-shell="a">
    <button data-layout-count onClick={() => setCount(value => value + 1)}>A {count}</button>
    <nav>
      <a data-alpha href="/app/alpha">Alpha</a>
      <a data-item href="/app/items/oak">Item</a>
      <a data-cross href="/app/beta">Beta</a>
      <a data-outside href="/app/outside">Outside</a>
      <a data-native-exact href="/app/items/native">Native item</a>
    </nav>
    {children}
  </div>
}
