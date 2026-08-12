import { useEffect, useState } from "@kudzujs/core"

export function getStaticPaths() {
  return ["oak", "pine", "vine"].map(id => ({ params: { id }, props: { id } }))
}

export default function Item({ id }: { id: string }) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    document.body.dataset.ready = "true"
  }, [])
  return <main><h1>{id}</h1><button onClick={() => setActive(!active)}>{active ? "Active" : "Idle"}</button></main>
}
