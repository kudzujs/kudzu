import { useEffect, useRef, useState } from "@kudzujs/core"

function MarkdownEditor({ active }: { active: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const editor = useRef<any>(null)
  const [value, setValue] = useState("Alpha")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!active) return
    const parent = host.current
    if (!parent) return
    let disposed = false
    import("@codemirror/view").then(({ EditorView }) => {
      if (disposed) return
      const view = new EditorView({
        doc: value,
        parent,
        extensions: [EditorView.contentAttributes.of({ "aria-label": "Markdown editor" })],
        dispatch: (transaction, currentView) => {
          currentView.update([transaction])
          if (transaction.docChanged) setValue(currentView.state.doc.toString())
        },
      })
      editor.current = view
      document.body.dataset.lazyEditorMounts = String(Number(document.body.dataset.lazyEditorMounts || "0") + 1)
    }).catch(cause => {
      if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => {
      disposed = true
      const view = editor.current
      if (view) view.destroy()
      editor.current = null
      document.body.dataset.lazyEditorDisposals = String(Number(document.body.dataset.lazyEditorDisposals || "0") + 1)
    }
  }, [active])

  useEffect(() => {
    const view = editor.current
    if (!view) return
    const current = view.state.doc.toString()
    try {
      if (value === "Failure") view.dispatch({ changes: { from: current.length + 1, insert: value } })
      else if (current !== value) view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
      setError("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [value])

  return <section>
    <button data-update-lazy-editor onClick={() => setValue("Beta")}>Update editor</button>
    <button data-fail-lazy-editor onClick={() => setValue("Failure")}>Fail editor update</button>
    <output data-lazy-editor-value>{value}</output>
    {error && <p role="alert">{error}</p>}
    <div data-lazy-editor-host ref={host}></div>
  </section>
}

export default function Page() {
  const [visible, setVisible] = useState(false)
  return <main>
    <button data-toggle-lazy-editor onClick={() => setVisible(!visible)}>Toggle editor</button>
    {visible && <MarkdownEditor active={visible} />}
  </main>
}
