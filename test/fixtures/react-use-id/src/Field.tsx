import { useId as makeId } from "react"

export function Field({ label }: { label: string }) {
  const id = makeId()

  return <div>
    <label htmlFor={id}>{label}</label>
    <input id={id} aria-describedby={`${id}-hint`} />
    <small id={`${id}-hint`}>Required</small>
  </div>
}
