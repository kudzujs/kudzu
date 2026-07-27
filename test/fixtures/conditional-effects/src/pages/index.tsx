import { useEffect, useState } from "@kudzujs/core"

function Resource({ count }: { count: number }) {
  useEffect(() => {
    document.body.dataset.effectLog = `${document.body.dataset.effectLog ?? ""}|setup ${count}`
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

  return <main>
    <button data-action="open" onClick={() => setOpen(true)}>Open</button>
    <button data-action="close" onClick={() => setOpen(false)}>Close</button>
    <button data-action="count" onClick={() => setCount(count + 1)}>Count</button>
    {open && <Resource count={count} />}
  </main>
}
