import { useEffect, useState } from "react"

export function ImportedAgeInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [inputValue, setInputValue] = useState(value.toString())
  useEffect(() => {
    if (Number(inputValue) !== value) setInputValue(value.toString())
  }, [value])
  return <input id="age-input" type="number" value={inputValue} onChange={event => {
    const next = event.currentTarget.value
    setInputValue(next)
    if (next !== "") onChange(Number(next))
  }} />
}
