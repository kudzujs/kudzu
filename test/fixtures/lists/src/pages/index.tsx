import { useState } from "@kudzujs/core"

type Item = { id: number; name: string; tone: string; done: boolean; type: string; style: { color: string } }

type ItemRowProps = Omit<Item, "type"> & { onFinish: () => void; onRemove: () => void }

function ItemRow({ id, name, tone, done, style, onFinish, onRemove }: ItemRowProps) {
  const rowClass = done ? "done" : "active"
  const ariaLabel = `${name} item`
  const rowStyle = { opacity: done ? 0.5 : 1, borderWidth: done ? 2 : 1, "--tone": tone }
  return <li data-id={id} className={rowClass} aria-label={ariaLabel} style={rowStyle}>
    <span>{name.toUpperCase()} tree</span><small style={style}>{name}</small><input data-uncontrolled />
    {done ? <strong data-status>{name} complete</strong> : <button data-finish onClick={onFinish}>Finish {name}</button>}
    {done && <em data-and>Done</em>}
    <button data-remove onClick={() => onRemove()}>Remove</button>
  </li>
}

function TableRow({ item }: { item: Item }) {
  return <tr data-row={item.id}><td>{item.name}</td></tr>
}

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

  const rows = items.map(item => <ItemRow
    key={item.id}
    id={item.id}
    name={item.name}
    tone={item.tone}
    done={item.done}
    style={item.style}
    onFinish={() => setItems(items.map(entry => entry.id === item.id ? { ...entry, done: true } : entry))}
    onRemove={() => setItems(items.filter(entry => entry.id !== item.id))}
  />)
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
    <ol data-copy>
      {items.map(item => <ItemRow key={item.id} id={item.id} name={item.name} tone={item.tone} done={item.done} style={item.style} onFinish={() => setItems(items)} onRemove={() => setItems(items)} />)}
    </ol>
    <ul data-static>
      <ItemRow id={99} name="Static" tone="plain" done={false} style={{ color: "gray" }} onFinish={() => { document.body.dataset.staticFinish = "yes" }} onRemove={() => { document.body.dataset.staticRemove = "yes" }} />
    </ul>
    <table><tbody>
      {items.map(item => <TableRow key={item.id} item={item} />)}
    </tbody></table>
  </main>
}
