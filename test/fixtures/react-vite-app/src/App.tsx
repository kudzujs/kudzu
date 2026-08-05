import React, { type ReactNode, memo as preserve, useEffect as runEffect, useMemo as derive, useState as useMenuState } from "react"
import clsx from "clsx"
import "./app.css"
import logo from "./logo.svg?url"
import { useCounter } from "./useCounter"
import { useSecondaryCounter } from "./useSecondaryCounter"
import { calculateSummary } from "./calculateSummary"
import type { TypeOnly } from "./TypeOnly"

function Brand(): ReactNode {
  return <strong>Compiler-grown UI</strong>
}

const MemoBrand = preserve(Brand)

function SecondaryCounter() {
  const { secondary, setSecondary, increment } = useSecondaryCounter()
  return <button id="secondary" onClick={increment}>Secondary {secondary}</button>
}

export default function App() {
  const typeChecked: TypeOnly = { label: "Compiler-grown UI" }
  const [menuOpen, setMenuOpen] = useMenuState(false)
  const { count, setCount, status, setStatus, offset, setOffset, selection, setSelection, increment, reset } = useCounter()
  const [items, setItems] = React.useState([{ id: "a", label: "Alpha", visible: true }, { id: "b", label: "Beta", visible: false }])
  const doubled = count * 2
  const summary = calculateSummary(count, 3)
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
      <small>{typeChecked.label}</small>
      <button id="counter" onClick={increment}>Count {count}</button>
      <button id="reset" onClick={reset}>Reset</button>
      <output id="status">{status}</output>
      <output id="offset">{offset}</output>
      <output id="selection">{selection}</output>
      <output id="doubled">Double {doubled}</output>
      <output id="summary">Summary {summary.total} / {summary.remaining}</output>
      <SecondaryCounter />
      <button id="show-items" onClick={() => setItems(items.map(item => ({ ...item, visible: true })))}>Show items</button>
      <ul id="memo-items" className={clsx("items", { open: menuOpen })}>{visibleItems.map(item => <li key={item.id} data-item={item.id}>{item.label}</li>)}</ul>
    </main>
  </React.Fragment>
}
