import { useEffect, useState } from "react"
import { deriveVariant } from "../derive"

export default function ProductActions() {
  const [color, setColor] = useState("Black")
  const [size, setSize] = useState("M")
  const selected = deriveVariant(color, size)

  useEffect(() => {
    document.body.dataset.variant = selected.id
    document.body.dataset.variantRuns = String(Number(document.body.dataset.variantRuns ?? "0") + 1)
  }, [selected.id])

  return <main>
    <button onClick={() => setColor("Black")}>Black</button>
    <button onClick={() => setColor("Ivory")}>Ivory</button>
    <button onClick={() => setSize("S")}>Small</button>
    <button onClick={() => setSize("M")}>Medium</button>
    <output>{selected.price}</output>
    <button disabled={!selected.available}>Add to cart</button>
  </main>
}
