import { useEffect, useRef, useState } from "@kudzujs/core"

export default function Page() {
  const [active, setActive] = useState(false)
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState("")
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    let disposed = false
    let view: { destroy(): void } | undefined
    setError("")
    import("@codemirror/view").then(({ EditorView }) => {
      if (disposed) return
      view = new EditorView({ doc: "Lazy editor", parent: host.current! })
      document.body.dataset.lazyEditorMounts = String(Number(document.body.dataset.lazyEditorMounts || "0") + 1)
    }).catch(cause => {
      if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => {
      disposed = true
      if (view) {
        view.destroy()
        document.body.dataset.lazyEditorDisposals = String(Number(document.body.dataset.lazyEditorDisposals || "0") + 1)
      }
    }
  }, [active, retry])

  return <main>
    <button data-toggle-lazy-editor onClick={() => setActive(!active)}>{active ? "Close editor" : "Open editor"}</button>
    {error && <p role="alert">{error}</p>}
    {error && <button data-retry-lazy-editor onClick={() => setRetry(retry + 1)}>Retry editor</button>}
    <div data-lazy-editor-host ref={host}></div>
  </main>
}
