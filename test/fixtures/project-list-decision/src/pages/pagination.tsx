import { useState } from "@kudzujs/core"

type Item = { id: number; label: string }

const initialItems: Item[] = Array.from({ length: 10000 }, (_, index) => ({ id: index + 1, label: `Project ${index + 1}` }))

export default function Page() {
  const [items, _setItems] = useState(initialItems)
  const [offset, setOffset] = useState(0)
  return <main data-strategy="pagination">
    <h1>10,000 project pagination decision</h1>
    <button data-previous hidden={offset === 0} onClick={() => setOffset(offset - 100)}>Previous 100</button>
    <button data-next hidden={offset === 9900} onClick={() => setOffset(offset + 100)}>Next 100</button>
    <output data-range aria-live="polite">{offset + 1}-{offset + 100}</output>
    <table><caption>Projects</caption><thead><tr><th>Project</th><th>Action</th></tr></thead>
      <tbody data-project-list>{items.slice(offset, offset + 100).map(item => <tr key={item.id} data-project={item.id}>
        <th scope="row">{item.label}</th><td><label>Edit {item.label}<input data-edit={item.id} defaultValue="" /></label></td>
      </tr>)}</tbody>
    </table>
  </main>
}
