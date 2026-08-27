type Item = { id: number; label: string }

const items: Item[] = Array.from({ length: 10000 }, (_, index) => ({ id: index + 1, label: `Project ${index + 1}` }))

export default function Page() {
  return <main data-strategy="direct">
    <h1>10,000 project direct decision</h1>
    <table><caption>Projects</caption><thead><tr><th>Project</th><th>Action</th></tr></thead>
      <tbody data-project-list>{items.map(item => <tr key={item.id} data-project={item.id}>
        <th scope="row">{item.label}</th><td><label>Edit {item.label}<input data-edit={item.id} defaultValue="" /></label></td>
      </tr>)}</tbody>
    </table>
  </main>
}
