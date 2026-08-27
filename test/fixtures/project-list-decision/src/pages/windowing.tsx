import { useState } from "@kudzujs/core"

type Item = { id: number; label: string }

const initialItems: Item[] = Array.from({ length: 10000 }, (_, index) => ({ id: index + 1, label: `Project ${index + 1}` }))

export default function Page() {
  const [items, _setItems] = useState(initialItems)
  const [offset, setOffset] = useState(0)
  return <main data-strategy="windowing">
    <h1>10,000 project windowing decision</h1>
    <output data-range aria-live="polite">{offset + 1}-{offset + 100}</output>
    <div data-scroll-window style={{ height: "400px", overflowY: "auto" }} onScroll={(event: Event & { currentTarget: HTMLDivElement }) => setOffset(Math.min(9900, Math.floor(event.currentTarget.scrollTop / 40 / 100) * 100))}>
      <div data-before-spacer style={{ height: `${offset * 40}px` }}></div>
      <table><caption>Projects</caption><thead><tr><th>Project</th><th>Action</th></tr></thead>
        <tbody data-project-list>{items.slice(offset, offset + 100).map(item => <tr key={item.id} data-project={item.id} style={{ height: "40px" }}>
          <th scope="row">{item.label}</th><td><label>Edit {item.label}<input data-edit={item.id} defaultValue="" /></label></td>
        </tr>)}</tbody>
      </table>
      <div data-after-spacer style={{ height: `${(9900 - offset) * 40}px` }}></div>
    </div>
  </main>
}
