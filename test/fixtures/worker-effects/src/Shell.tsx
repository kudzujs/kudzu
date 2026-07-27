export function Shell({ children }: { children?: unknown }) {
  return <div data-shell>
    <nav>
      <a data-dashboard-link href="/dash/dashboard">Dashboard</a>
      <a data-plain-link href="/dash/plain">Plain</a>
      <a data-static-link href="/dash/static">Static</a>
    </nav>
    {children}
  </div>
}
