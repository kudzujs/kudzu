import { useId, useState } from "react"

function Field({ label }: { label: string }) {
  const id = useId()
  return <div>{label}: {id}</div>
}

export default function Page() {
  const [fields, setFields] = useState([{ id: "name", label: "Name" }])
  return <main>{fields.map(field => <Field key={field.id} label={field.label} />)}</main>
}
