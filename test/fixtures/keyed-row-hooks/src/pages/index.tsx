import { useState } from "@kudzujs/core"
import HookRow from "../HookRow"

type Item = { id: string; owner: string; label: string }
type Parent = { id: string; label: string; primary: Item[]; positional: Item[] }

function ParentRow({ parent }: { parent: Parent }) {
  const [visits, setVisits] = useState(0)
  const [details, setDetails] = useState({ active: true })

  return <section data-parent={parent.id}>
    <h2>{parent.label}</h2>
    <span data-parent-visits>{visits}</span>
    <span data-parent-active>{details.active ? "active" : "inactive"}</span>
    <button data-parent-increment onClick={() => {
      setVisits(visits + 1)
      setDetails({ active: !details.active })
    }}>Parent increment</button>
    <ul data-site="primary">{parent.primary.map(item => <HookRow key={item.id} item={item} site="primary" />)}</ul>
    <ul data-site="positional">{parent.positional.map((item, index) => <HookRow key={index} item={item} site="positional" />)}</ul>
  </section>
}

const initialParents: Parent[] = [
  {
    id: "p1",
    label: "Parent one",
    primary: [{ id: "shared", owner: "p1", label: "One shared" }, { id: "other", owner: "p1", label: "One other" }],
    positional: [{ id: "shared", owner: "p1", label: "One positional" }, { id: "last", owner: "p1", label: "One last" }]
  },
  {
    id: "p2",
    label: "Parent two",
    primary: [{ id: "shared", owner: "p2", label: "Two shared" }],
    positional: [{ id: "shared", owner: "p2", label: "Two positional" }]
  }
]

export default function KeyedRowHooksPage() {
  const [parents, setParents] = useState(initialParents)
  const [showSecond, setShowSecond] = useState(true)

  return <main>
    <button data-action="hide-second" onClick={() => setShowSecond(false)}>Hide second parent</button>
    <button data-action="show-second" onClick={() => setShowSecond(true)}>Show second parent</button>
    <button data-action="parent-reorder" onClick={() => setParents([...parents].reverse())}>Reorder parents</button>
    <button data-action="child-reorder" onClick={() => setParents(parents.map(parent => parent.id === "p1" ? { ...parent, primary: [...parent.primary].reverse() } : parent))}>Reorder children</button>
    <button data-action="positional-reorder" onClick={() => setParents(parents.map(parent => parent.id === "p1" ? { ...parent, positional: [...parent.positional].reverse() } : parent))}>Reorder positional</button>
    <button data-action="rename" onClick={() => setParents(parents.map(parent => parent.id === "p1" ? { ...parent, primary: parent.primary.map(item => item.id === "shared" ? { ...item, label: "One renamed" } : item) } : parent))}>Rename</button>
    <button data-action="remove" onClick={() => setParents(parents.map(parent => parent.id === "p1" ? { ...parent, primary: parent.primary.filter(item => item.id !== "shared") } : parent))}>Remove</button>
    <button data-action="readd" onClick={() => setParents(parents.map(parent => parent.id === "p1" ? { ...parent, primary: [...parent.primary, { id: "shared", owner: "p1", label: "One readded" }] } : parent))}>Re-add</button>
    <div data-parents>{parents.map(parent => (showSecond || parent.id !== "p2") && <ParentRow key={parent.id} parent={parent} />)}</div>
  </main>
}
