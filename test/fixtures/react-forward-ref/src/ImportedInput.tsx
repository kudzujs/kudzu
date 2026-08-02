import React from "react"

type InputProps = {
  "aria-label": string
  name: string
}

export const ImportedInput = React.forwardRef<HTMLInputElement, InputProps>(function ImportedInput(props, inputRef) {
  return <input {...props} data-imported ref={inputRef} />
})
