import { useState } from "@kudzujs/core"

function StaticBadge({ active }: { active: boolean }) {
  return <div className={active ? "prop-active" : "prop-idle"}>Static prop</div>
}

function Field({ value }: { value: unknown }) {
  return <input value={value ?? ""} />
}

export default function BindingPage() {
  const [active, setActive] = useState(false)
  const [name, setName] = useState("Kudzu")
  const [flag, setFlag] = useState(false)
  const [choice] = useState("Grown")
  const activeClass = "is-active"

  return (
    <main>
      <div className={active ? activeClass : "idle"}>{name}</div>
      <div className={JSON.stringify({ active })}>Object shorthand</div>
      <StaticBadge active={true} />
      <StaticBadge active={active} />
      {[1].map(item => <div className={active ? `nested-${item}` : "nested-idle"}>Nested</div>)}
      <div className={[false].map(active => active ? "on" : "off").join(" ")}>Shadowed</div>
      <button disabled={!active} onClick={() => setActive(true)}>Activate</button>
      <button disabled={active} onClick={() => setActive(false)}>Reset</button>
      <input value={name} onChange={() => setName("Grown")} />
      <input value={flag} onChange={() => setFlag(true)} />
      <Field value={name + "!"} />
      <input type="checkbox" checked={active} />
      <input type="radio" checked={!active} />
      <select value={choice}><option>Kudzu</option><option>Grown</option></select>
      <input
        type="checkbox"
        className={active ? "ready" : "waiting"}
        checked={active}
        aria-checked={active}
        data-state={active ? "open" : "closed"}
        hidden={!active}
        title={active ? "Active" : "Inactive"}
      />
      <div style={{ color: active ? "green" : "red", width: active ? 12 : 8, opacity: active ? 1 : 0.5, "--accent": active ? 2 : 1 }}>Styled</div>
    </main>
  )
}
