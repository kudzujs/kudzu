import { useState } from "react"

const example = "const distance = Math.sqrt(x * x + y * y)"

export function CopyBlock() {
  const [status, setStatus] = useState("Copy")

  return <div>
    <pre><code>{example}</code></pre>
    <button onClick={async () => {
      try {
        await navigator.clipboard.writeText(example)
        setStatus("Copied")
      } catch {
        setStatus("Copy failed")
      }
    }}>{status}</button>
  </div>
}

export function Tabs() {
  const [tab, setTab] = useState("formula")

  return <section>
    <div role="tablist" aria-label="Math explanation">
      <button role="tab" aria-selected={tab === "formula"} onClick={() => setTab("formula")}>Formula</button>
      <button role="tab" aria-selected={tab === "result"} onClick={() => setTab("result")}>Result</button>
    </div>
    {tab === "formula" && <p>Distance uses the Pythagorean theorem.</p>}
    {tab === "result" && <p>The result is five.</p>}
  </section>
}
