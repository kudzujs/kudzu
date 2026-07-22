import { useState } from "@kudzujs/core"

type Item = { id: number; name: string; tone: string; done: boolean; type: string; style: { color: string } }

export default function ListPage() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Oak", tone: "warm", done: false, type: "undefined", style: { color: "brown" } },
    { id: 2, name: "Pine", tone: "cool", done: true, type: "undefined", style: { color: "green" } }
  ])

  function add() {
    setItems([...items, { id: 3, name: "Elm", tone: "green", done: false, type: "undefined", style: { color: "olive" } }])
  }

  function rename() {
    setItems(items.map(item => item.id === 1 ? { ...item, name: "Red oak", tone: "hot", done: true } : item))
  }

  function reorder() {
    setItems([...items].reverse())
  }

  function remove() {
    setItems(items.filter(item => item.id !== 2))
  }

  function duplicate() {
    setItems(items.map(item => ({ ...item, id: 1 })))
  }

  const rows = items.map(item => <li key={item.id} data-id={item.id} className={item.done ? "done" : "active"} aria-label={`${item.name} item`} style={{ opacity: item.done ? 0.5 : 1, borderWidth: item.done ? 2 : 1, "--tone": item.tone }}>
    <span>{item.name.toUpperCase()} tree</span><small style={item.style}>{item.name}</small><input data-uncontrolled />
    <button data-remove onClick={() => setItems(items.filter(entry => entry.id !== item.id))}>Remove</button>
  </li>)
  const unusedRows = items.map(item => <p key={item.id}>{item.name}</p>)

  return <main>
    <button data-action="add" onClick={add}>Add</button>
    <button data-action="rename" onClick={rename}>Rename</button>
    <button data-action="reorder" onClick={reorder}>Reorder</button>
    <button data-action="remove" onClick={remove}>Remove</button>
    <button data-action="duplicate" onClick={duplicate}>Duplicate</button>
    <ul data-list>
      {rows}
    </ul>
    <table><tbody>
      {items.map(item => <tr key={item.id} data-row={item.id}><td>{item.name}</td></tr>)}
    </tbody></table>
  </main>
}
