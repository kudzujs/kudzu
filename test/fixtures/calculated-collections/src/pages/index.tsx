import { useState } from "@kudzujs/core"
import { calculate } from "../calculate"

export default function Page() {
  const [phase, setPhase] = useState(0)
  const [selected, setSelected] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const result = calculate(phase)

  return <main>
    <button data-phase="1" onClick={() => setPhase(1)}>Add and move</button>
    <button data-phase="2" onClick={() => setPhase(2)}>Reorder and remove</button>
    <button data-phase="3" onClick={() => setPhase(3)}>Remove again</button>
    <output data-total>{result.total}</output>
    <svg data-chart viewBox="0 0 100 50" aria-label="Calculated points">
      {result.points.map(point => <circle key={point.id} data-point={point.id} className={`point ${selectedId === point.id ? "selected" : ""}`} cx={point.x} cy={point.y} r="4" role="button" tabIndex={0} aria-label={point.label} aria-describedby="point-tooltip" aria-current={selectedId === point.id ? "true" : "false"} onClick={() => { document.body.dataset.selected = point.label; setSelected(point.label); setSelectedId(point.id) }} onFocus={() => { setSelected(point.label); setSelectedId(point.id) }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(point.label); setSelectedId(point.id) } }} />)}
    </svg>
    <p id="point-tooltip" role="tooltip" aria-live="polite" hidden={!selected}>{selected || "No point selected"}</p>
  </main>
}
