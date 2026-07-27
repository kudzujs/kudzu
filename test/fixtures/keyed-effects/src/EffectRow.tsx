import { useEffect } from "@kudzujs/core"

type Item = { id: number; name: string }

export default function EffectRow({ item, version }: { item: Item; version: number }) {
  const label = item.name.toUpperCase()

  useEffect(() => {
    const connected = document.querySelector(`[data-row="${item.id}"]`)?.isConnected
    document.body.dataset.effectLog = `${document.body.dataset.effectLog ?? ""}|mount ${label}:${connected}`
    return () => {
      document.body.dataset.effectLog += `|unmount ${label}`
    }
  }, [])

  useEffect(() => {
    document.body.dataset.effectLog += `|dep ${item.name}:${version}`
    return () => {
      document.body.dataset.effectLog += `|dep-clean ${item.name}:${version}`
    }
  }, [version])

  return <li data-row={item.id}>{item.name}</li>
}
