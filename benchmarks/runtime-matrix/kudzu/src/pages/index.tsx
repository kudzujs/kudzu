import { useEffect, useRef, useState } from "@kudzujs/core"

type Row = { id: number; label: string }

const initialRows: Row[] = Array.from({ length: 1000 }, (_, id) => ({ id, label: `Row ${id}` }))
const initialRecords: Row[] = Array.from({ length: 2000 }, (_, id) => ({ id, label: id === 1337 ? "Unique needle" : `Record ${id}` }))
const initialConditional: Row[] = Array.from({ length: 200 }, (_, id) => ({ id, label: `Detail ${id}` }))
const points = [{ id: 1, x: 20, y: 30 }, { id: 2, x: 50, y: 20 }, { id: 3, x: 80, y: 40 }]

function OwnedRow({ row }: { row: Row }) {
  const [selected, setSelected] = useState(false)
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.dataset.mounted = "true"
    return () => {
      if (row.id === 500) {
        const cleanup = document.querySelector("[data-row-cleanup]")
        if (cleanup) cleanup.textContent = "cleaned 500"
      }
    }
  }, [])
  return <li ref={ref} data-row={row.id} data-selected={selected}>
    <button data-row-toggle={row.id} aria-pressed={selected} onClick={() => setSelected(!selected)}>{row.label}</button>
  </li>
}

function ConditionalChild() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const setup = document.querySelector("[data-child-setup]")
    if (setup) setup.textContent = `setup ${count}`
    return () => {
      const cleanup = document.querySelector("[data-child-cleanup]")
      if (cleanup) cleanup.textContent = `cleanup ${count}`
    }
  }, [count])
  return <div data-conditional>
    <button data-action="child-state" onClick={() => setCount(count + 1)}>Update child <span data-child-state>{count}</span></button>
    {initialConditional.map(item => <p key={item.id} data-detail={item.id}>{item.label}</p>)}
  </div>
}

export default function Page() {
  const [scalar, setScalar] = useState(0)
  const [second, setSecond] = useState(0)
  const [profile, setProfile] = useState({ name: "Ada", revisions: 0 })
  const [shown, setShown] = useState(true)
  const [rows, setRows] = useState(initialRows)
  const [records, setRecords] = useState(initialRecords)
  const [conditional, setConditional] = useState(initialConditional)
  const [query, setQuery] = useState("")
  const [effectTick, setEffectTick] = useState(0)
  const [asyncTick, setAsyncTick] = useState(0)
  const [selectedPoint, setSelectedPoint] = useState(1)
  const visibleRecords = records.filter(record => record.label.toLowerCase().includes(query.toLowerCase()))
  const derived = scalar + second

  useEffect(() => {
    const setup = document.querySelector("[data-effect-setup]")
    if (setup) setup.textContent = `setup ${effectTick}`
    return () => {
      const cleanup = document.querySelector("[data-effect-cleanup]")
      if (cleanup) cleanup.textContent = `cleanup ${effectTick}`
    }
  }, [effectTick])

  return <main>
    <h1>Runtime matrix</h1>
    <nav aria-label="Sibling routes"><a href="/static">Static sibling</a></nav>
    <section aria-labelledby="scalar-heading">
      <h2 id="scalar-heading">State and derived bindings</h2>
      <button data-action="scalar" onClick={() => setScalar(scalar + 1)}>Update scalar</button>
      <button data-action="second" onClick={() => setSecond(second + 2)}>Update second state</button>
      <button data-action="object" onClick={() => setProfile({ ...profile, revisions: profile.revisions + 1 })}>Replace object</button>
      <output data-scalar data-value={scalar} className={scalar % 2 ? "odd" : "even"} style={{ color: scalar % 2 ? "blue" : "black", opacity: scalar % 2 ? 0.9 : 1 }}>{scalar}</output>
      <output data-second>{second}</output><output data-derived>{derived}</output><output data-object>{profile.name} {profile.revisions}</output>
      <label>Controlled value <input data-controlled value={scalar} readOnly /></label>
    </section>
    <section aria-labelledby="conditional-heading">
      <h2 id="conditional-heading">Conditional range</h2>
      <button data-action="conditional" onClick={() => setShown(!shown)}>Toggle details</button>
      <output data-child-setup>setup pending</output><output data-child-cleanup>cleanup pending</output>
      {shown && <ConditionalChild />}
    </section>
    <section aria-labelledby="rows-heading">
      <h2 id="rows-heading">Keyed rows</h2>
      <button data-action="row-update" onClick={() => setRows(rows.map(row => row.id === 500 ? { ...row, label: "Row 500 updated" } : row))}>Update one row</button>
      <button data-action="row-filter" onClick={() => setRows(rows.filter(row => row.id === 500))}>Filter rows</button>
      <button data-action="row-restore" onClick={() => setRows(initialRows)}>Restore rows</button>
      <button data-action="row-reverse" onClick={() => setRows([...rows].reverse())}>Reverse rows</button>
      <button data-action="row-remove" onClick={() => setRows(rows.filter(row => row.id !== 500))}>Remove row</button>
      <button data-action="row-append" onClick={() => setRows([...rows, { id: 500, label: "Row 500 re-added" }])}>Re-add row</button>
      <output data-row-cleanup>not cleaned</output>
      <ul data-rows>{rows.map(row => <OwnedRow key={row.id} row={row} />)}</ul>
    </section>
    <section aria-labelledby="search-heading">
      <h2 id="search-heading">Reactive search</h2>
      <button data-action="search" onClick={() => setQuery("unique needle")}>Find unique record</button>
      <button data-action="search-restore" onClick={() => setQuery("")}>Restore records</button>
      <output data-query>{query}</output>
      <ul data-records>{visibleRecords.map(record => <li key={record.id} data-record={record.id}>{record.label}</li>)}</ul>
    </section>
    <section aria-labelledby="svg-heading">
      <h2 id="svg-heading">Accessible SVG</h2>
      <svg role="img" aria-labelledby="svg-title" viewBox="0 0 100 60"><title id="svg-title">Selectable points</title>
        {points.map(point => <circle key={point.id} data-point={point.id} cx={point.x} cy={point.y} r="6" role="button" tabIndex={0} aria-label={`Point ${point.id}`} aria-pressed={selectedPoint === point.id} onClick={() => setSelectedPoint(point.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") setSelectedPoint(point.id) }} />)}
      </svg>
      <output data-selected-point>{selectedPoint}</output>
    </section>
    <section aria-labelledby="effects-heading">
      <h2 id="effects-heading">Effects and async handlers</h2>
      <button data-action="effect" onClick={() => setEffectTick(effectTick + 1)}>Update effect</button>
      <output data-effect-setup>setup pending</output><output data-effect-cleanup>cleanup pending</output>
      <button data-action="async" onClick={async () => { await Promise.resolve(); setAsyncTick(asyncTick + 1) }}>Update async</button>
      <output data-async>{asyncTick}</output>
    </section>
  </main>
}
