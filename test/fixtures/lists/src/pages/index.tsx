import { useState } from "@kudzujs/core"

type Item = { id: number; name: string; tone: string }

export default function ListPage() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Oak", tone: "warm" },
    { id: 2, name: "Pine", tone: "cool" }
  ])

  function add() {
    setItems([...items, { id: 3, name: "Elm", tone: "green" }])
  }

  function rename() {
    setItems(items.map(item => item.id === 1 ? { ...item, name: "Red oak", tone: "hot" } : item))
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
      {items.map(item => <li key={item.id} data-id={item.id} className={item.tone}><span>{item.name} tree</span><input data-uncontrolled /></li>)}
    </ul>
    <table><tbody>
      {items.map(item => <tr key={item.id} data-row={item.id}><td>{item.name}</td></tr>)}
    </tbody></table>
  </main>
}
