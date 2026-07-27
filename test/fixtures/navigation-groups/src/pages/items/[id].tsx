import { useEffect, useParams, useState } from "@kudzujs/core"
import { ShellA } from "../../ShellA"

export const layout = ShellA
export const runtimeParams = true

export default function Item() {
  const { id } = useParams<{ id: string }>()
  const [count, setCount] = useState(0)
  useEffect(() => {
    document.body.dataset.itemEffect = id
  }, [id])
  return <main data-route="item" data-id={id}><h1>Item {id}</h1><button data-route-count onClick={() => setCount(value => value + 1)}>Route {count}</button></main>
}
