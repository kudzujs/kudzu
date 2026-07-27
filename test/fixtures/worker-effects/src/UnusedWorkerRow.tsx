import { useEffect } from "@kudzujs/core"

export default function UnusedWorkerRow({ item }: { item: { id: number; name: string } }) {
  useEffect(() => {
    const worker = new Worker(new URL("./unused.worker.ts", import.meta.url), { type: "module" })
    return () => worker.terminate()
  }, [])
  return <li>{item.name}</li>
}
