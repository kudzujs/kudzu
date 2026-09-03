export function Shell({ children }: { children: unknown }) {
  return <>
    <header className="site-header">
      <a className="brand" href="/">
        <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
          <path d="M7 29V7h22L18 18l11 11H7Z" />
        </svg>
        <span>Field Notes</span>
      </a>
      <nav aria-label="Primary">
        <a href="/articles/">Articles</a>
        <a href="/topics/performance/">Performance</a>
        <a href="/about/">About</a>
      </nav>
    </header>
    <main>{children}</main>
    <footer><p>Field Notes · Independent engineering writing since 2021.</p></footer>
  </>
}
