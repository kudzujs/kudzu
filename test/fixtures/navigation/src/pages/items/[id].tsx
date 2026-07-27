import { useEffect, useParams, useState } from "@kudzujs/core"
import { Shell } from "../../Shell"

export const layout = Shell
export const metadata = { title: "Runtime item" }
export const runtimeParams = true

export default function Item() {
  const { id } = useParams<{ id: string }>()
  const [count, setCount] = useState(0)

  useEffect(() => {
    document.body.dataset.runtimeLog = `${document.body.dataset.runtimeLog ?? ""}|setup ${id}`
    return async () => {
      await Promise.resolve()
      document.body.dataset.runtimeLog += `|cleanup ${id}`
    }
  }, [id])

  function mark() {
    document.body.dataset.runtimeCapture = id
  }

  return <main data-route="item" data-item-id={id} data-item-count={count}>
    <h1>Item {id}</h1>
    <p data-item-direct>{id}</p>
    <p data-item-derived>{`Selected ${id}`}</p>
    <button data-route-count onClick={() => setCount(value => value + 1)}>Route {count}</button>
    <button data-item-capture onClick={mark}>Capture</button>
    <a data-item-a href="/shop/items/oak">Oak item</a>
    <a data-item-b href="/shop/items/pine">Pine item</a>
  </main>
}
