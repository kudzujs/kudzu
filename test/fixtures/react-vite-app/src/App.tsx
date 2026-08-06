import React, { type ReactNode, memo as preserve, useEffect as runEffect, useMemo as derive, useState as useMenuState } from "react"
import clsx from "clsx"
import "./app.css"
import logo from "./logo.svg?url"
import { useCounter } from "./useCounter"
import { useErrorFlash } from "./useErrorFlash"
import { usePulse } from "./hooks"
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

function DebouncedEditor() {
  const [draft, setDraft] = useMenuState("")
  const [saved, setSaved] = useMenuState("")
  runEffect(() => {
    const timer = setTimeout(() => {
      document.body.dataset.debounceCommit = draft
      setSaved(draft)
    }, 80)
    return () => clearTimeout(timer)
  }, [draft])

  return <section id="debounced-editor">
    <input id="draft" value={draft} onInput={event => setDraft(event.currentTarget.value)} />
    <output id="debounced">{saved}</output>
  </section>
}

function ErrorFlash() {
  const { flashing, setFlashing, flash } = useErrorFlash()
  const { pending, setPending, pulse } = usePulse()
  return <>
    <button id="error-flash" onClick={flash} onBlur={() => setFlashing(false)}>{flashing ? "Error" : "Ready"}</button>
    <button id="pulse" onClick={pulse} onBlur={() => setPending(false)}>{pending ? "Pending" : "Ready"}</button>
  </>
}

export default function App() {
  const typeChecked: TypeOnly = { label: "Compiler-grown UI" }
  const [menuOpen, setMenuOpen] = useMenuState(false)
  const { count, setCount, status, setStatus, offset, setOffset, selection, setSelection, increment, reset, copy } = useCounter()
  const [editorOpen, setEditorOpen] = useMenuState(true)
  const [flashOpen, setFlashOpen] = useMenuState(true)
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
      <button id="copy" onClick={copy}>Copy count</button>
      <button id="editor-toggle" onClick={() => setEditorOpen(!editorOpen)}>Toggle editor</button>
      <button id="flash-toggle" onClick={() => setFlashOpen(!flashOpen)}>Toggle flash</button>
      {editorOpen && <DebouncedEditor />}
      {flashOpen && <ErrorFlash />}
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
