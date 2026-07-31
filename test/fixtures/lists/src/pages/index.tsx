import { useState } from "@kudzujs/core"

type Item = { id: number; name: string; tone: string; done: boolean; type: string; style: { color: string } }
type MixedItem = { id: number | string; name: string }

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
  return <tr data-row={item.id} title={item.tone}><td>{item.name}</td></tr>
}

export default function ListPage() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Oak", tone: "warm", done: false, type: "undefined", style: { color: "brown" } },
    { id: 2, name: "Pine", tone: "cool", done: true, type: "undefined", style: { color: "green" } }
  ])
  const [mixedItems, setMixedItems] = useState<MixedItem[]>([
    { id: 1, name: "Numeric" },
    { id: "1", name: "String" }
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
    setItems([...items, { ...items[0] }])
  }

  function appendMany() {
    setItems([...items,
      { id: 4, name: "Ash", tone: "pale", done: false, type: "undefined", style: { color: "gray" } },
      { id: 5, name: "<img src=x onerror=alert(1)>&", tone: `\" onmouseover=\"alert(1)`, done: false, type: "undefined", style: { color: "white" } }
    ])
  }

  function updateAppended() {
    setItems(items.map(item => item.id === 4 ? { ...item, name: "White ash", tone: "bright" } : item))
  }

  function removeAppended() {
    setItems(items.filter(item => item.id !== 4))
  }

  function invalidateRetained() {
    Object.defineProperty(items[0], "invalid", { value: undefined, enumerable: true, configurable: true })
    setItems([...items])
  }

  function repairRetained() {
    delete (items[0] as Item & { invalid?: undefined }).invalid
    setItems([...items])
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
    <button data-action="append-many" onClick={appendMany}>Append many</button>
    <button data-action="update-appended" onClick={updateAppended}>Update appended</button>
    <button data-action="remove-appended" onClick={removeAppended}>Remove appended</button>
    <button data-action="invalidate-retained" onClick={invalidateRetained}>Invalidate retained</button>
    <button data-action="repair-retained" onClick={repairRetained}>Repair retained</button>
    <button data-action="update-mixed" onClick={() => setMixedItems(mixedItems.map(item => ({ ...item, name: `${item.name} updated` })))}>Update mixed keys</button>
    <button data-action="invalidate-mixed-late" onClick={() => setMixedItems([
      { id: 1, name: "Partial write" },
      { id: "late", name: undefined as unknown as string }
    ])}>Invalidate mixed keys late</button>
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
    <ul data-mixed-list>
      {mixedItems.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  </main>
}
