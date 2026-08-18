import { createRef } from "react"

export default function Page() {
  const ref = createRef<HTMLDivElement>()
  return <main>Invalid {ref.current ? "mounted" : "empty"}</main>
}
