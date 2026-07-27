import { useEffect, useParams, useRef, useState } from "@kudzujs/core"

export { Shell as layout } from "../../Shell"
export const runtimeParams = true

function RouteResource({ value }: { value: number }) {
  useEffect(() => {
    document.body.dataset.routeResource = String(value)
  }, [value])
  return <aside>Route resource {value}</aside>
}

export default function ItemPage() {
  const { id } = useParams<{ id: string }>()
  const [routeState, _setRouteState] = useState(2)
  const [routeItems, _setRouteItems] = useState([{ id: "item", label: "Item" }])
  const routeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    document.body.dataset.routeEffect = `${id}:${routeState}`
  }, [id, routeState])

  return <main ref={routeRef}>
    <h1>Item {id}</h1>
    {routeState > 0 && <RouteResource value={routeState} />}
    <ul>{routeItems.map(item => <li key={item.id}>{item.label}</li>)}</ul>
  </main>
}
