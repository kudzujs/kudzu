import { useState } from "@kudzujs/core"

type Child = { id: string; title: string }
type Parent = { id: string; children: Child[]; optional?: Child[] | null }

export default function NestedIndexedOptionalPage() {
  const [parents, setParents] = useState<Parent[]>([{ id: "parent", children: [{ id: "a", title: "Alpha" }, { id: "b", title: "Beta" }], optional: null }])

  return <main>
    <button data-action="reverse" onClick={() => setParents(parents.map(parent => ({ ...parent, children: [...parent.children].reverse() })))}>Reverse</button>
    <button data-action="update" onClick={() => setParents(parents.map(parent => ({ ...parent, children: parent.children.map(child => child.id === "a" ? { ...child, title: "Alpha updated" } : child) })))}>Update</button>
    {parents.map(parent => <section key={parent.id} data-parent={parent.id}>
      <div data-children>{parent.children?.map((child, index) => <button key={child.id} data-child={child.id} onClick={() => { document.body.dataset.selected = `${index}:${child.title}` }}>
        <span>{index}:{child.title}</span>
        {index === 0 ? <b data-first>First</b> : null}
      </button>)}</div>
      <div data-optional>{parent.optional?.map(child => <i key={child.id} data-optional-child={child.id}>{child.title}</i>)}</div>
    </section>)}
  </main>
}
