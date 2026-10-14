import { useEffect, useState } from "react"
import { derivePreferredVariant } from "../derive"

export default function PreferredProductActions() {
  const [color, setColor] = useState("Black")
  const [size, setSize] = useState("M")
  const preferredColor = "Black"
  const selected = derivePreferredVariant(color, size, preferredColor)

  useEffect(() => {
    document.body.dataset.preferenceRuns = String(Number(document.body.dataset.preferenceRuns ?? "0") + 1)
    return () => {
      document.body.dataset.preferenceCleanups = String(Number(document.body.dataset.preferenceCleanups ?? "0") + 1)
    }
  }, [selected.available])

  return <main>
    <h1>Preferred product options</h1>
    <p data-preference>{preferredColor}</p>
    <button onClick={() => setColor("Black")}>Black</button>
    <button onClick={() => setColor("Ivory")}>Ivory</button>
    <button onClick={() => setSize("S")}>Small</button>
    <button onClick={() => setSize("M")}>Medium</button>
    <output data-price>{selected.price}</output>
    <button data-purchase disabled={!selected.available}>Add to cart</button>
  </main>
}
