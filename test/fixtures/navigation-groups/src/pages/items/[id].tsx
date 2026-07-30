import { useEffect, useParams, useState } from "@kudzujs/core"
import { ShellA } from "../../ShellA"

export const layout = ShellA
export const runtimeParams = true

export default function Item() {
  const { id } = useParams<{ id: string }>()
  const [count, setCount] = useState(0)
  const [groups, setGroups] = useState([{ id: "g1", items: [{ id: "a1", label: "Oak", available: true }] }])
  useEffect(() => {
    document.body.dataset.itemEffect = id
  }, [id])
  return <main data-route="item" data-id={id}>
    <h1>Item {id}</h1>
    <button data-route-count onClick={() => setCount(value => value + 1)}>Route {count}</button>
    <button data-update-child onClick={() => setGroups(groups.map(group => ({ ...group, items: group.items.map(item => item.id === "a1" ? { ...item, label: "Ash", available: false } : item) })))}>Update child</button>
    <button data-add-child onClick={() => setGroups(groups.map(group => ({ ...group, items: [...group.items, { id: "a2", label: "Pine", available: false }] })))}>Add child</button>
    <div data-groups>{groups.map(group => <section key={group.id} data-group={group.id}>
      <ul>{group.items.map(item => <li key={item.id} data-child={item.id} title={item.label}>{item.label}{item.available ? <strong>Available</strong> : <small>Unavailable</small>}</li>)}</ul>
    </section>)}</div>
  </main>
}
