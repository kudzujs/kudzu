import type { ReactNode } from "react";

export function Shell({ children }: { children?: ReactNode }) {
  return (
    <>
      <header>
        <a href="/">Answer</a>
        <nav aria-label="Primary">
          <a href="/questions">Questions</a>
          <a href="/tags">Tags</a>
          <a href="/admin/dashboard">Admin</a>
        </nav>
      </header>
      <div className="shell">
        <aside aria-label="Sections">
          <a href="/questions">All questions</a>
          <a href="/tags">All tags</a>
        </aside>
        {children}
      </div>
      <footer>Powered by Answer</footer>
    </>
  );
}
