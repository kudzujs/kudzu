import { createRef, useState } from "react"
import useOutsideClickAlerter from "./useOutsideClickAlerter"

export function Dropdown() {
  const wrapperRef = createRef<HTMLDivElement>()
  const [showResults, setShowResults] = useState(true)
  useOutsideClickAlerter(wrapperRef, () => setShowResults(false))
  return <section>
    <div id="wrapper" ref={wrapperRef}>
      <button id="inside" onClick={() => setShowResults(true)}>Open</button>
      {showResults && <p id="results">Results</p>}
    </div>
  </section>
}
