import { useEffect } from "@kudzujs/core"

type Item = { id: number; name: string; detail: string }

export default function EffectRow({ item, version, setResult }: { item: Item; version: number; setResult: (value: string) => void }) {
  const label = item.name.toUpperCase()

  useEffect(() => {
    const connected = document.querySelector(`[data-row="${item.id}"]`)?.isConnected
    document.body.dataset.effectLog = `${document.body.dataset.effectLog ?? ""}|mount ${label}:${connected}`
    return () => {
      document.body.dataset.effectLog += `|unmount ${label}`
    }
  }, [item.id])

  useEffect(() => {
    document.body.dataset.effectLog += `|dep ${item.name}:${item.detail}:${version}`
    new Promise<string>(resolve => {
      const resolvers = (document.body as any).rowResolvers ?? {}
      resolvers[item.id] = resolve
      ;(document.body as any).rowResolvers = resolvers
    }).then(setResult)
    return async () => {
      document.body.dataset.effectLog += `|dep-clean ${item.name}:${version}`
      await new Promise(resolve => setTimeout(resolve, 25))
    }
  }, [version, item.name])

  return <li data-row={item.id}>{item.name}</li>
}
