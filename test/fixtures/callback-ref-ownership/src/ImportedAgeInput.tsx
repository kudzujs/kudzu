import { useEffect, useState } from "react"
import ImportedTooltip from "./ImportedTooltip"

export function ImportedAgeInput({ value, onChange, tooltip, id = "age-input" }: { value: number; onChange: (value: number) => void; tooltip?: string; id?: string }) {
  const [inputValue, setInputValue] = useState(value.toString())
  useEffect(() => {
    if (Number(inputValue) !== value) setInputValue(value.toString())
  }, [value])
  return <label>Age
    {tooltip && <ImportedTooltip content={tooltip} />}
    <input id={id} type="number" value={inputValue} onChange={event => {
      const next = event.currentTarget.value
      setInputValue(next)
      if (next !== "") onChange(Number(next))
    }} />
  </label>
}
