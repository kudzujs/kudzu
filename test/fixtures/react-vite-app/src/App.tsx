import React, { type ReactNode, memo as preserve, useCallback, useEffect as runEffect, useMemo as derive, useState as useMenuState } from "react"
import clsx from "clsx"
import "./app.css"
import logo from "./logo.svg?url"

function Brand(): ReactNode {
  return <strong>Compiler-grown UI</strong>
}

const MemoBrand = preserve(Brand)

export default function App() {
  const [menuOpen, setMenuOpen] = useMenuState(false)
  const [count, setCount] = React.useState(0)
  const [items, setItems] = React.useState([{ id: "a", label: "Alpha", visible: true }, { id: "b", label: "Beta", visible: false }])
  const increment = useCallback(() => setCount(count + 1), [count])
  const doubled = derive(() => count * 2, [count])
  const visibleItems = derive(() => items.filter(item => item.visible).map(item => ({ id: item.id, label: item.label })), [items])
  runEffect(() => {
    console.log("React Vite app mounted")
  }, [])

  return <React.Fragment>
    <header>
      <img src={logo} alt="Leaf mark" />
      <MemoBrand />
      <button id="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
      {menuOpen && <nav>Migration guide</nav>}
    </header>
    <main>
      <h1>React Vite migration</h1>
      <button id="counter" onClick={increment}>Count {count}</button>
      <output id="doubled">Double {doubled}</output>
      <button id="show-items" onClick={() => setItems(items.map(item => ({ ...item, visible: true })))}>Show items</button>
      <ul id="memo-items" className={clsx("items", { open: menuOpen })}>{visibleItems.map(item => <li key={item.id} data-item={item.id}>{item.label}</li>)}</ul>
    </main>
  </React.Fragment>
}
