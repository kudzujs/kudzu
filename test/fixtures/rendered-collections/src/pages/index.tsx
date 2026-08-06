/// <reference lib="es2023.array" />

import { useState } from "@kudzujs/core"
import { selectVisible } from "../selectVisible"

type Item = { id: string; label: string; visible: boolean; marker?: string | null }
type Group = { id: string; children: Item[] }

const initialItems: Item[] = [
  { id: "a", label: "Alpha", visible: true },
  { id: "b", label: "Beta", visible: false, marker: null },
  { id: "c", label: "Gamma", visible: true, marker: "set" }
]

export default function RenderedCollectionsPage() {
  const [items, setItems] = useState(initialItems)
  const [groups, setGroups] = useState<Group[]>([
    { id: "empty", children: [] },
    { id: "full", children: [{ id: "x", label: "Xray", visible: true }] }
  ])
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState("a")
  const visible = items.filter((item, index) => item.visible && index >= 0)
  const importedVisible = selectVisible(items)
  const pageItems = items.slice(page * 2, page * 2 + 2)
  const searchedItems = items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
  const sortedItems = items.toSorted((left, right) => left.label.localeCompare(right.label))

  return <main>
    <button data-action="show" onClick={() => setItems(items.map(item => item.id === "b" ? { ...item, visible: true } : item))}>Show beta</button>
    <button data-action="reverse" onClick={() => setItems([...items].reverse())}>Reverse</button>
    <button data-action="remove" onClick={() => setItems(items.filter(item => item.id !== "b"))}>Remove beta</button>
    <button data-action="add-child" onClick={() => setGroups(groups.map(group => group.id === "empty" ? { ...group, children: [{ id: "z", label: "Zulu", visible: true }] } : group))}>Add child</button>
    <button data-action="duplicate" onClick={() => setGroups(groups.map(group => ({ ...group, children: [{ id: "same", label: group.id, visible: true }] })))}>Duplicate</button>
    <button data-action="page-previous" onClick={() => setPage(0)}>Previous page</button>
    <button data-action="page-next" onClick={() => setPage(1)}>Next page</button>
    <button data-action="search" onClick={() => setQuery("mm")}>Search gamma</button>
    <button data-action="search-clear" onClick={() => setQuery("")}>Clear search</button>
    <button data-action="select-a" onClick={() => setSelectedId("a")}>Select alpha</button>
    <button data-action="select-c" onClick={() => setSelectedId("c")}>Select gamma</button>

    <ul data-conditional-and>{items.map(item => selectedId === item.id && <li key={item.id} data-id={item.id}>{item.label}</li>)}</ul>

    <ul data-conditional-ternary>{items.map(item => item.visible ? <li key={item.id} data-id={item.id}>{item.label}</li> : null)}</ul>

    <ul data-stable>{visible.map((item, index) => <li key={item.id} data-id={item.id}>
      <span>{index}:{item.label}</span>
      <button data-pick onClick={() => { document.body.dataset.pick = `${index}:${item.label}` }}>Pick</button>
      {index === 0 ? <b data-first>First</b> : null}
      {index === 2 ? <button data-index-branch onClick={() => { document.body.dataset.branch = `${index}:${item.label}` }}>{index}:{item.label}</button> : null}
    </li>)}</ul>

    <ul data-reused>{visible.map(item => <li key={item.id} data-id={item.id}>{item.label}</li>)}</ul>

    <ul data-imported>{importedVisible.map(item => <li key={item.id} data-id={item.id}>{item.label}</li>)}</ul>

    <ul data-page>{pageItems.map(item => <li key={item.id} data-id={item.id}>{item.label}</li>)}</ul>

    <ul data-search>{searchedItems.map(item => <li key={item.id} data-id={item.id}>{item.label}</li>)}</ul>

    <ul data-sorted>{sortedItems.map(item => <li key={item.id} data-id={item.id}>{item.label}</li>)}</ul>

    <ol data-positional>{items.filter(item => item.visible).map((item, index) => <li key={index} data-id={item.id}>
      <span>{index}:{item.label}</span>
      <button data-pick onClick={() => { document.body.dataset.position = `${index}:${item.label}` }}>Pick</button>
    </li>)}</ol>

    <div data-from>{Array.from(items).filter(item => item.visible).map(item => <i key={item.id}>{item.label}</i>)}</div>
    <div data-from-direct>{Array.from(items, (item, index) => <i key={item.id}>{index}:{item.label}</i>)}</div>
    <div data-from-map>{Array.from(items, (item, index) => ({ id: item.id, label: `${index}-${item.label}`, visible: item.visible })).filter(item => item.visible).map(item => <i key={item.id}>{item.label}</i>)}</div>
    <div data-flat>{groups.flatMap(group => group.children).map(item => <i key={item.id} data-id={item.id}>{item.label}</i>)}</div>
    <div data-undefined>{items.filter(item => item.marker === undefined).map(item => <i key={item.id}>{item.label}</i>)}</div>
    <section data-groups>{groups.map(group => {
      const visibleChildren = group.children.filter(item => item.visible)
      return <div key={group.id} data-group={group.id}>
        {visibleChildren.map((item, index) => <span key={item.id}>{index}:{item.label}</span>)}
        <div data-conditional-children>{group.children.map(item => item.visible && <i key={item.id} data-id={item.id}>{item.label}</i>)}</div>
      </div>
    })}</section>
  </main>
}
