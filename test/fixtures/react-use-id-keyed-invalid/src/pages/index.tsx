import { useId, useState } from "react"

function Field({ label }: { label: string }) {
  const id = useId()
  return <label htmlFor={id}>{label}<input id={id} /></label>
}

export default function Page() {
  const [fields, setFields] = useState([{ id: "name", label: "Name" }])
  return <main>{fields.map(field => <Field key={field.id} label={field.label} />)}</main>
}
