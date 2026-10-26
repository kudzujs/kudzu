import { useEffect, useId, useRef, useState } from "@kudzujs/core"

function Row({ item }: { item: { id: number; label: string } }) {
  const id = useId()
  const ref = useRef<HTMLLIElement>(null)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (ref.current) ref.current.dataset.ready = "true"
    return () => {
      const output = document.querySelector("[data-cleanup]")
      if (output) output.textContent = "cleaned"
    }
  }, [])
  return <li ref={ref} title={item.label}>
    <span data-label>{item.label}</span>
    <label htmlFor={id}>Note</label><input id={id} />
    <button data-count onClick={() => setCount(count + 1)}>{count}</button>
    <button data-item-count onClick={() => {
      setCount(count + item.label.length)
      if (ref.current) ref.current.dataset.clicked = item.label
    }}>Add label length</button>
  </li>
}

export default function OwnedRows() {
  const [items, setItems] = useState([{ id: 1, label: "Initial" }])
  return <main>
    <button data-update onClick={() => setItems([{ id: 1, label: "Latest" }])}>Update</button>
    <button data-update-again onClick={() => setItems([{ id: 1, label: "Again" }])}>Update again</button>
    <button data-remove onClick={() => setItems([])}>Remove</button>
    <button data-add onClick={() => setItems([{ id: 2, label: "Added" }])}>Add</button>
    <output data-cleanup>pending</output>
    <ul>{items.map(item => <Row key={item.id} item={item} />)}</ul>
  </main>
}
