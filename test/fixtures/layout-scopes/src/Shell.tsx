import { useEffect, useRef, useState } from "@kudzujs/core"

function LayoutResource({ value }: { value: number }) {
  useEffect(() => {
    document.body.dataset.layoutResource = String(value)
  }, [value])
  return <aside>Layout resource {value}</aside>
}

export function Shell({ children }: { children?: unknown }) {
  const [layoutState, _setLayoutState] = useState(1)
  const [layoutItems, _setLayoutItems] = useState([{ id: "nav", label: "Navigation" }])
  const layoutRef = useRef<HTMLElement>(null)

  useEffect(() => {
    document.body.dataset.layoutEffect = String(layoutState)
  }, [layoutState])

  return <div data-shell>
    <header ref={layoutRef}>Layout {layoutState}</header>
    {layoutState > 0 && <LayoutResource value={layoutState} />}
    <nav>{layoutItems.map(item => <a key={item.id} href="/">{item.label}</a>)}</nav>
    {children}
    <footer>Layout footer</footer>
  </div>
}
