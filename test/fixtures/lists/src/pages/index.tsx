import { useState } from "@kudzujs/core"

type Item = { id: number; name: string; tone: string; done: boolean; type: string }

export default function ListPage() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Oak", tone: "warm", done: false, type: "undefined" },
    { id: 2, name: "Pine", tone: "cool", done: true, type: "undefined" }
  ])

  function add() {
    setItems([...items, { id: 3, name: "Elm", tone: "green", done: false, type: "undefined" }])
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

  return <main>
    <button data-action="add" onClick={add}>Add</button>
    <button data-action="rename" onClick={rename}>Rename</button>
    <button data-action="reorder" onClick={reorder}>Reorder</button>
    <button data-action="remove" onClick={remove}>Remove</button>
    <button data-action="duplicate" onClick={duplicate}>Duplicate</button>
    <ul data-list>
      {items.map(item => <li key={item.id} data-id={item.id} className={item.done ? "done" : "active"} aria-label={`${item.name} item`}>
        <span>{item.name.toUpperCase()} tree</span><small>{item.name}</small><input data-uncontrolled />
        <button data-remove onClick={() => setItems(items.filter(entry => entry.id !== item.id))}>Remove</button>
      </li>)}
    </ul>
    <table><tbody>
      {items.map(item => <tr key={item.id} data-row={item.id}><td>{item.name}</td></tr>)}
    </tbody></table>
  </main>
}
