import { useState } from "@kudzujs/core"

export default function ListConditionRevision() {
  const [items, setItems] = useState([{ id: 1, label: "Initial", visible: false }])
  const [selected, setSelected] = useState(false)
  return <main>
    <button data-show onClick={() => {
      setItems([{ id: 1, label: "Updated", visible: true }])
      setSelected(true)
    }}>Update and select</button>
    <button data-hide onClick={() => {
      setItems([{ id: 1, label: "Hidden", visible: false }])
      setSelected(false)
    }}>Hide and deselect</button>
    <button data-toggle onClick={() => setSelected(!selected)}>Toggle selection</button>
    <ul>{items.map(item => <li key={item.id} data-row={item.id} aria-selected={selected && item.id === 1}>
      <span data-label>{item.label}</span>
      {item.visible && <strong data-detail>{item.label} detail</strong>}
    </li>)}</ul>
  </main>
}
