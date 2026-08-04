import { useRef } from "@kudzujs/core"

export function InvalidInput({ onValueChange }: { onValueChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>({} as unknown as null)
  return <input ref={inputRef} onInput={event => onValueChange(event.currentTarget.value)} />
}
