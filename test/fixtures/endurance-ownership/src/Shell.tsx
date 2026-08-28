export function Shell({ children }: { children?: unknown }) {
  return <div data-shell>
    <nav><a data-home-link href="/">Harness</a><a data-plain-link href="/plain">Plain</a><a data-release-link href="/release">Release</a></nav>
    {children}
  </div>
}
