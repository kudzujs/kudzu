import type { ReactNode } from "react"

export function Shell({ children }: { children?: ReactNode }) {
  return <><header data-socket-header><a href="/">Socket</a><a href="/other">Other</a></header>{children}</>
}
