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
  </li>
}

function DynamicId({ item }: { item: { id: number; target: string } }) {
  const [count, setCount] = useState(0)
  return <li><label htmlFor={item.target}>Dynamic note</label><input id={item.target} />
    <button onClick={() => setCount(count + 1)}>{count}</button></li>
}

function LiteralId({ item }: { item: { id: number } }) {
  const [count, setCount] = useState(0)
  return <li id="literal-$k" data-key={item.id}><button onClick={() => setCount(count + 1)}>{count}</button></li>
}

export default function ResolvedRows() {
  const [items, setItems] = useState([{ id: 1, label: "Initial" }])
  const [dynamic, setDynamic] = useState([{ id: 1, target: "initial" }])
  return <main>
    <button data-update onClick={() => {
      setItems([{ id: 1, label: "Latest" }])
      setDynamic([{ id: 1, target: "latest-$k" }])
    }}>Update</button>
    <button data-remove onClick={() => setItems([])}>Remove</button>
    <button data-add onClick={() => setItems([{ id: 2, label: "Added" }])}>Add</button>
    <output data-cleanup>pending</output>
    <ul data-resolved>{items.map(item => <Row key={item.id} item={item} />)}</ul>
    <ul data-dynamic>{dynamic.map(item => <DynamicId key={item.id} item={item} />)}</ul>
    <ul data-literal>{items.map(item => <LiteralId key={item.id} item={item} />)}</ul>
  </main>
}
