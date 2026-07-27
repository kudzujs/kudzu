import { useEffect } from "@kudzujs/core"

type Item = { id: number; name: string }

export default function EffectRow({ item, version }: { item: Item; version: number }) {
  useEffect(() => {
    document.body.dataset.rowLog = `${document.body.dataset.rowLog ?? ""}|mount ${item.name}`
    return () => {
      document.body.dataset.rowLog += `|unmount ${item.name}:${document.querySelector(`[data-row="${item.id}"]`)?.isConnected}`
    }
  }, [])

  useEffect(() => {
    document.body.dataset.rowLog += `|dep ${item.name}:${version}`
    return () => {
      document.body.dataset.rowLog += `|dep-clean ${item.name}:${version}`
    }
  }, [version])

  return <li data-row={item.id}>{item.name}</li>
}
