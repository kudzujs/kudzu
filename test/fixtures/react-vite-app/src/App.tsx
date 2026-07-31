import React, { useCallback, useEffect as runEffect, useState as useMenuState } from "react"
import "./app.css"
import logo from "./logo.svg?url"

export default function App() {
  const [menuOpen, setMenuOpen] = useMenuState(false)
  const [count, setCount] = React.useState(0)
  const increment = useCallback(() => setCount(count + 1), [count])
  runEffect(() => {
    console.log("React Vite app mounted")
  }, [])

  return <React.Fragment>
    <header>
      <img src={logo} alt="Leaf mark" />
      <button id="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
      {menuOpen && <nav>Migration guide</nav>}
    </header>
    <main>
      <h1>React Vite migration</h1>
      <button id="counter" onClick={increment}>Count {count}</button>
    </main>
  </React.Fragment>
}
