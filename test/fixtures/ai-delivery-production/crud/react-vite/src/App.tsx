import { MemosProvider, useMemos } from "./memos"

function MemoWorkspace() {
  const { memos, status, error, createMemo, updateMemo, deleteMemo, beginSync, failSync, retrySync } = useMemos()

  return <main>
    <header className="topbar">
      <a className="brand" href="/">Memos<span>workspace</span></a>
      <nav aria-label="Primary"><a href="/about/">About</a><span className="avatar" aria-label="Signed in as Alex Kim">AK</span></nav>
    </header>

    <div className="shell">
      <section className="intro" aria-labelledby="page-title">
        <div><p className="eyebrow">Team knowledge</p><h1 id="page-title">Memo workspace</h1><p>Capture decisions while they are still fresh.</p></div>
        <div className="sync-actions" aria-label="Synchronization controls">
          <button className="quiet" onClick={beginSync}>Sync</button>
          <button className="quiet" onClick={failSync}>Simulate error</button>
          <button className="quiet" onClick={retrySync}>Retry</button>
        </div>
      </section>

      <section className="composer" aria-labelledby="new-memo-title">
        <div><p className="eyebrow">Quick capture</p><h2 id="new-memo-title">Create a memo</h2></div>
        <form onSubmit={event => {
          event.preventDefault()
          const content = String(new FormData(event.currentTarget).get("content") || "").trim()
          if (!content) return
          createMemo(content)
          event.currentTarget.reset()
        }}>
          <label htmlFor="new-content">Memo content</label>
          <textarea id="new-content" name="content" required minLength={2} placeholder="What should the team remember?" />
          <div className="composer-footer"><span>Plain text · shared with the team</span><button>Create memo</button></div>
        </form>
      </section>

      <section className="feed" aria-labelledby="feed-title">
        <div className="feed-heading"><div><p className="eyebrow">Shared feed</p><h2 id="feed-title">Recent memos</h2></div><p className="count">{memos.length} records</p></div>
        <div className="filter-placeholder" aria-label="Filter memos"><span>All memos</span><small>Status filters are not implemented.</small></div>
        <p className="result-status" role="status" aria-live="polite">Showing {memos.length} of {memos.length} memos</p>
        <ul className="memo-list">{memos.map(memo => <li className="memo-card" key={memo.id} data-memo-id={memo.id}>
          <div className="memo-meta"><span className={memo.archived ? "badge archived" : "badge active"}>{memo.archived ? "Archived" : "Active"}</span><time>{memo.updatedAt}</time></div>
          <form onSubmit={event => {
            event.preventDefault()
            const content = String(new FormData(event.currentTarget).get("content") || "").trim()
            if (content) updateMemo(memo.id, content)
          }}>
            <label htmlFor={`memo-${memo.id}`}>Edit memo {memo.id}</label>
            <textarea id={`memo-${memo.id}`} name="content" required defaultValue={memo.content} />
            <div className="card-actions"><button className="quiet">Save changes</button><button className="danger" type="button" onClick={() => deleteMemo(memo.id)}>Delete</button></div>
          </form>
        </li>)}</ul>
      </section>

      <div className="announcements">
        <p role="status" aria-live="polite">{status}</p>
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  </main>
}

export default function App() {
  return <MemosProvider><MemoWorkspace /></MemosProvider>
}
