import { useEffect, useState } from "@kudzujs/core"
import EffectRow from "../EffectRow"
import { Shell } from "../Shell"

export const layout = Shell

function Resource({ count, setResult }: { count: number; setResult: (value: string) => void }) {
  useEffect(() => {
    document.body.dataset.routeLog = `${document.body.dataset.routeLog ?? ""}|setup ${count}:${document.querySelector("[data-resource]")?.isConnected}`
    new Promise<string>(resolve => {
      const resolvers = (document.body as any).ownedResolvers ?? []
      resolvers.push(resolve)
      ;(document.body as any).ownedResolvers = resolvers
    }).then(setResult)
    return async () => {
      document.body.dataset.routeLog += `|cleanup ${count}:${document.querySelector("[data-resource]")?.isConnected}`
      document.body.dataset.disposeOrder = `${document.body.dataset.disposeOrder ?? ""}|route`
      await new Promise(resolve => setTimeout(resolve, 20))
      document.body.dataset.routeCleanup = `${document.body.dataset.routeCleanup ?? ""}|done ${count}`
    }
  }, [count])

  return <p data-resource>Resource {count}</p>
}

export default function Page() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [result, setResult] = useState("pending")
  const [version, setVersion] = useState(0)
  const [items, setItems] = useState([{ id: 1, name: "Oak" }, { id: 2, name: "Pine" }])

  return <main data-route="home">
    <button data-open onClick={() => setOpen(true)}>Open</button>
    <button data-close onClick={() => setOpen(false)}>Close</button>
    <button data-count onClick={() => setCount(count + 1)}>Count</button>
    <button data-add onClick={() => setItems([...items, { id: 3, name: "Elm" }])}>Add</button>
    <button data-reorder onClick={() => setItems([...items].reverse())}>Reorder</button>
    <button data-update onClick={() => {
      setItems(items.map(item => item.id === 1 ? { ...item, name: "Red oak" } : item))
      setVersion(version + 1)
    }}>Update</button>
    <button data-remove onClick={() => setItems(items.filter(item => item.id !== 2))}>Remove</button>
    <p data-result>{result}</p>
    {open && <Resource count={count} setResult={setResult} />}
    <ul>{items.map(item => <EffectRow key={item.id} item={item} version={version} />)}</ul>
  </main>
}
