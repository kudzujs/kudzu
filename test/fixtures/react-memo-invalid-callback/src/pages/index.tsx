import { useMemo, useState } from "react"

export default function Page() {
  const [items] = useState([{ id: "a" }])
  const values = useMemo(() => items.map(async item => item), [items])
  return <main>{values.length}</main>
}
