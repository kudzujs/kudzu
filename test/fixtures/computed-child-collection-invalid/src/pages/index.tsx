import { useState } from "@kudzujs/core"

export default function Page() {
  const [groups, setGroups] = useState([{ id: "g", children: [{ id: "a", visible: true }] }])

  return <main>
    <button onClick={() => setGroups(groups)}>Reset</button>
    {groups.map(group => {
      const visibleChildren = group.children.filter(item => item.visible)
      return <section key={group.id}>
        <p>{visibleChildren.length}</p>
        {visibleChildren.map(item => <span key={item.id}>{item.id}</span>)}
      </section>
    })}
  </main>
}
