import { useEffect, useRef, useState } from "@kudzujs/core"
import { EditorView } from "@codemirror/view"

function MarkdownEditor() {
  const host = useRef<HTMLDivElement>(null)
  const editor = useRef<any>(null)
  const [value, setValue] = useState("Alpha")
  const [error, setError] = useState("")

  useEffect(() => {
    const parent = host.current
    if (!parent) return
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
    document.body.dataset.editorMounts = String(Number(document.body.dataset.editorMounts || "0") + 1)
    return () => {
      view.destroy()
      editor.current = null
      document.body.dataset.editorDisposals = String(Number(document.body.dataset.editorDisposals || "0") + 1)
    }
  }, [])

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
    <button data-update-editor onClick={() => setValue("Beta")}>Update editor</button>
    <button data-fail-editor onClick={() => setValue("Failure")}>Fail editor update</button>
    <output data-editor-value>{value}</output>
    {error && <p role="alert">{error}</p>}
    <div data-editor-host ref={host}></div>
  </section>
}

export default function Page() {
  const [visible, setVisible] = useState(true)
  return <main>
    <button data-toggle-editor onClick={() => setVisible(!visible)}>Toggle editor</button>
    {visible && <MarkdownEditor />}
  </main>
}
