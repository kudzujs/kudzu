export function Shell({ children }: { children?: unknown }) {
  return <div data-shell>
    <nav>
      <a data-chart-link href="/">Chart</a>
      <a data-plain-link href="/plain">Plain</a>
      <a data-static-link href="/static">Static</a>
    </nav>
    {children}
  </div>
}
