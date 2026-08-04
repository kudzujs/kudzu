import type { ReactNode } from "react"

function Frame({ children }: { children: ReactNode }) {
  return <main>{children}</main>
}

export default function Page() {
  return <Frame>
    <input onChange={event => console.log(event.currentTarget.value)} />
    <select onChange={event => console.log(event.currentTarget.value)}><option>All</option></select>
  </Frame>
}
