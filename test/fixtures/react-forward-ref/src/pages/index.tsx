import { forwardRef as withRef, useRef } from "react"
import { ImportedInput } from "../ImportedInput"

type InputProps = {
  "aria-label": string
  name: string
}

const LocalInput = withRef<HTMLInputElement, InputProps>(({ name, ...inputProps }, inputRef) =>
  <input {...inputProps} name={name} data-local ref={inputRef} />
)

export default function Page() {
  const localRef = useRef<HTMLInputElement>(null)
  const importedRef = useRef<HTMLInputElement>(null)

  return <main>
    <LocalInput ref={localRef} name="local" aria-label="Local input" />
    <ImportedInput ref={importedRef} name="imported" aria-label="Imported input" />
    <LocalInput name="optional" aria-label="Optional ref" />
  </main>
}
