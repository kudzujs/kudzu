import { useEffect, useState } from "@kudzujs/core"

function Resource({ count, setResult }: { count: number; setResult: (value: string) => void }) {
  useEffect(() => {
    document.body.dataset.effectLog = `${document.body.dataset.effectLog ?? ""}|setup ${count}`
    new Promise<string>(resolve => {
      const resolvers = (document.body as any).effectResolvers ?? []
      resolvers.push(resolve)
      ;(document.body as any).effectResolvers = resolvers
    }).then(setResult)
    return async () => {
      await Promise.resolve()
      document.body.dataset.effectLog += `|cleanup ${count}`
    }
  }, [count])

  return <p data-resource>Resource {count}</p>
}

export default function Page() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [result, setResult] = useState("pending")

  return <main>
    <button data-action="open" onClick={() => setOpen(true)}>Open</button>
    <button data-action="close" onClick={() => setOpen(false)}>Close</button>
    <button data-action="count" onClick={() => setCount(count + 1)}>Count</button>
    <p data-result>{result}</p>
    {open && <Resource count={count} setResult={setResult} />}
  </main>
}
