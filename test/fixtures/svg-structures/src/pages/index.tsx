import { useState } from "@kudzujs/core"

type Dot = { id: number; label: string; x: number; color: string }

export default function Page() {
  const [visible, setVisible] = useState(true)
  const [dots, setDots] = useState<Dot[]>([
    { id: 1, label: "Oak", x: 20, color: "green" },
    { id: 2, label: "Pine", x: 50, color: "navy" }
  ])

  return <main>
    <button data-toggle onClick={() => setVisible(!visible)}>Toggle</button>
    <button data-add onClick={() => setDots([...dots, { id: 3, label: "Elm", x: 80, color: "olive" }])}>Add</button>
    <button data-rename onClick={() => setDots(dots.map(dot => dot.id === 1 ? { ...dot, label: "Red oak", color: "crimson" } : dot))}>Rename</button>
    <button data-reorder onClick={() => setDots([...dots].reverse())}>Reorder</button>
    <button data-remove onClick={() => setDots(dots.filter(dot => dot.id !== 2))}>Remove</button>
    <svg data-map viewBox="0 0 100 40">
      {visible ? <g data-visible><title>Visible</title></g> : <text data-hidden>Hidden</text>}
      {dots.map(dot => <g key={dot.id} data-dot={dot.id}>
        <circle cx={dot.x} cy="20" r="5" fill={dot.color} />
        <text x={dot.x} y="35">{dot.label}</text>
      </g>)}
    </svg>
  </main>
}
