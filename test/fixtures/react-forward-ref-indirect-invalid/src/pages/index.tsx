import { forwardRef } from "react"

function renderInput(props: { name: string }, inputRef: unknown) {
  return <input {...props} ref={inputRef} />
}

const Input = forwardRef(renderInput)

export default function Page() {
  return <Input name="invalid" />
}
