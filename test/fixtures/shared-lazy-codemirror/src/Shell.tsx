export function Shell({ children }: { children?: unknown }) {
  return <><nav><a href="/">First owner</a><a data-second-page href="/second">Second owner</a></nav>{children}</>
}
