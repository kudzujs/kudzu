import { forwardRef } from "react"

const Input = forwardRef((props: { name: string }, inputRef) =>
  <label><input {...props} ref={inputRef} /></label>
)

export default function Page() {
  return <Input name="invalid" />
}
