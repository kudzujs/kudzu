import { useMemo } from "react"

export default function Page() {
  const value = useMemo(() => Date.now(), [])
  return <main>{value}</main>
}
