import { useState } from "react"

const makeInitial = () => ({ value: 0 })

export default function Page() {
  const [state] = useState(() => makeInitial())
  return <main>{state.value}</main>
}
